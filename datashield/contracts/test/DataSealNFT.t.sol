// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import "../contracts/DataSealNFT.sol";

contract DataSealNFTTest is Test {
    DataSealNFT nft;

    uint256 oraclePk;
    address oracle;

    address uploader;
    address reporter;

    event Sealed(uint256 indexed tokenId, bytes32 indexed datasetHash, address uploader, uint8 score, uint256 stake);
    event Slashed(uint256 indexed tokenId, address uploader, uint256 amount, address reporter);

    function setUp() public {
        oraclePk = 0xA11CE;
        oracle = vm.addr(oraclePk);
        uploader = address(0xBEEF);
        reporter = address(0xCAFE);

        nft = new DataSealNFT(oracle, oracle);
    }

    function _oracleSig(bytes32 dh, bytes32 srh, uint8 score) internal view returns (bytes memory) {
        bytes32 msgHash = keccak256(abi.encodePacked(dh, srh, score));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function testMintSuccess() public {
        bytes32 datasetHash = keccak256("dataset1");
        bytes32 scanHash = keccak256("scan1");
        uint8 score = 80;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);

        vm.expectEmit(true, true, true, true);
        emit Sealed(1, datasetHash, uploader, score, 100 ether);

        uint256 tokenId = nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "text-classification", 123, sig);
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), uploader);
        assertEq(nft.hashToToken(datasetHash), 1);
    }

    function testMintFailsScoreBelowThreshold() public {
        bytes32 datasetHash = keccak256("dataset2");
        bytes32 scanHash = keccak256("scan2");
        uint8 score = 50;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);
        vm.expectRevert(bytes("DataSeal: score below threshold"));
        nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "nlp", 1, sig);
    }

    function testMintFailsWrongOracleSig() public {
        bytes32 datasetHash = keccak256("dataset3");
        bytes32 scanHash = keccak256("scan3");
        uint8 score = 80;

        uint256 wrongPk = 0xB0B;
        bytes32 msgHash = keccak256(abi.encodePacked(datasetHash, scanHash, score));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPk, ethHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);
        vm.expectRevert(bytes("DataSeal: invalid oracle signature"));
        nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "other", 1, sig);
    }

    function testMintFailsDuplicateDatasetHash() public {
        bytes32 datasetHash = keccak256("dataset4");
        bytes32 scanHash1 = keccak256("scan4a");
        bytes32 scanHash2 = keccak256("scan4b");
        uint8 score = 80;

        bytes memory sig1 = _oracleSig(datasetHash, scanHash1, score);
        bytes memory sig2 = _oracleSig(datasetHash, scanHash2, score);

        vm.deal(uploader, 400 ether);

        vm.prank(uploader);
        nft.mint{value: 100 ether}(datasetHash, scanHash1, score, "Dataset", "nlp", 1, sig1);

        vm.prank(uploader);
        vm.expectRevert(bytes("DataSeal: dataset already sealed"));
        nft.mint{value: 100 ether}(datasetHash, scanHash2, score, "Dataset", "nlp", 1, sig2);
    }

    function testMintFailsInsufficientStake() public {
        bytes32 datasetHash = keccak256("dataset5");
        bytes32 scanHash = keccak256("scan5");
        uint8 score = 80;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);
        vm.expectRevert(bytes("DataSeal: insufficient stake"));
        nft.mint{value: 1 ether}(datasetHash, scanHash, score, "Dataset", "nlp", 1, sig);
    }

    function testAnchorDAProofStoresRoot() public {
        bytes32 datasetHash = keccak256("dataset6");
        bytes32 scanHash = keccak256("scan6");
        uint8 score = 80;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);
        uint256 tokenId = nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "nlp", 1, sig);

        bytes32 daRoot = keccak256("daRoot");
        vm.prank(oracle);
        nft.anchorDAProof(tokenId, daRoot);

        DataSealNFT.DataSeal memory seal = nft.getSeal(tokenId);
        assertEq(seal.daProofRoot, daRoot);
    }

    function testSlashSuccessSetsSlashedAndEmits() public {
        bytes32 datasetHash = keccak256("dataset7");
        bytes32 scanHash = keccak256("scan7");
        uint8 score = 80;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);
        uint256 tokenId = nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "nlp", 1, sig);

        vm.expectEmit(true, true, true, true);
        emit Slashed(tokenId, uploader, 100 ether, reporter);

        vm.prank(oracle);
        nft.slash(tokenId, reporter);
        assertTrue(nft.isSlashed(tokenId));
    }

    function testSlashTwiceReverts() public {
        bytes32 datasetHash = keccak256("dataset8");
        bytes32 scanHash = keccak256("scan8");
        uint8 score = 80;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(uploader, 200 ether);
        vm.prank(uploader);
        uint256 tokenId = nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "nlp", 1, sig);

        vm.prank(oracle);
        nft.slash(tokenId, reporter);

        vm.prank(oracle);
        vm.expectRevert(bytes("DataSeal: already slashed"));
        nft.slash(tokenId, reporter);
    }
}

