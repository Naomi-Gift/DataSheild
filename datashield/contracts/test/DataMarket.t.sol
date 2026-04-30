// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import "../contracts/DataSealNFT.sol";
import "../contracts/DataMarket.sol";
import "../src/MockOGToken.sol";

contract DataMarketTest is Test {
    DataSealNFT nft;
    DataMarket market;
    MockOGToken og;

    uint256 oraclePk;
    address oracle;

    address seller;
    address buyer;
    address treasury;
    address reporter;

    function setUp() public {
        oraclePk = 0xA11CE;
        oracle = vm.addr(oraclePk);

        seller = address(0xBEEF);
        buyer = address(0xF00D);
        treasury = address(0x123456);
        reporter = address(0xCAFE);

        nft = new DataSealNFT(oracle, oracle);
        og = new MockOGToken();
        market = new DataMarket(address(nft), address(og), treasury);
    }

    function _oracleSig(bytes32 dh, bytes32 srh, uint8 score) internal view returns (bytes memory) {
        bytes32 msgHash = keccak256(abi.encodePacked(dh, srh, score));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function _mintToSeller() internal returns (uint256 tokenId, bytes32 datasetHash) {
        datasetHash = keccak256("dataset");
        bytes32 scanHash = keccak256("scan");
        uint8 score = 80;
        bytes memory sig = _oracleSig(datasetHash, scanHash, score);

        vm.deal(seller, 200 ether);
        vm.prank(seller);
        tokenId = nft.mint{value: 100 ether}(datasetHash, scanHash, score, "Dataset", "nlp", 10, sig);
    }

    function testListSuccessCreatesListing() public {
        (uint256 tokenId,) = _mintToSeller();

        vm.prank(seller);
        nft.approve(address(market), tokenId);

        vm.prank(seller);
        market.list(tokenId, 100 ether);

        DataMarket.Listing memory l = market.getListing(tokenId);
        assertEq(l.seller, seller);
        assertEq(l.price, 100 ether);
        assertTrue(l.active);
    }

    function testListWithSlashedNFTReverts() public {
        (uint256 tokenId,) = _mintToSeller();

        vm.prank(oracle);
        nft.slash(tokenId, reporter);

        vm.prank(seller);
        nft.approve(address(market), tokenId);

        vm.prank(seller);
        vm.expectRevert(bytes("DataMarket: slashed seal"));
        market.list(tokenId, 100 ether);
    }

    function testPurchaseSuccessTransfersAndSplitsPayment() public {
        (uint256 tokenId,) = _mintToSeller();

        vm.prank(seller);
        nft.approve(address(market), tokenId);

        vm.prank(seller);
        market.list(tokenId, 100 ether);

        og.mint(buyer, 200 ether);
        vm.prank(buyer);
        og.approve(address(market), 200 ether);

        uint256 sellerBalBefore = og.balanceOf(seller);
        uint256 treasuryBalBefore = og.balanceOf(treasury);

        vm.prank(buyer);
        market.purchase(tokenId);

        assertEq(nft.ownerOf(tokenId), buyer);

        // 97.5% / 2.5% split
        assertEq(og.balanceOf(seller) - sellerBalBefore, 97.5 ether);
        assertEq(og.balanceOf(treasury) - treasuryBalBefore, 2.5 ether);
    }

    function testPurchaseSlashedNFTReverts() public {
        (uint256 tokenId,) = _mintToSeller();

        vm.prank(seller);
        nft.approve(address(market), tokenId);

        vm.prank(seller);
        market.list(tokenId, 100 ether);

        vm.prank(oracle);
        nft.slash(tokenId, reporter);

        og.mint(buyer, 200 ether);
        vm.prank(buyer);
        og.approve(address(market), 200 ether);

        vm.prank(buyer);
        vm.expectRevert(bytes("DataMarket: slashed seal"));
        market.purchase(tokenId);
    }

    function testDelistDeactivatesListing() public {
        (uint256 tokenId,) = _mintToSeller();

        vm.prank(seller);
        nft.approve(address(market), tokenId);

        vm.prank(seller);
        market.list(tokenId, 100 ether);

        vm.prank(seller);
        market.delist(tokenId);

        DataMarket.Listing memory l = market.getListing(tokenId);
        assertFalse(l.active);
    }

    function testUpdatePriceUpdatesListing() public {
        (uint256 tokenId,) = _mintToSeller();

        vm.prank(seller);
        nft.approve(address(market), tokenId);

        vm.prank(seller);
        market.list(tokenId, 100 ether);

        vm.prank(seller);
        market.updatePrice(tokenId, 123 ether);

        DataMarket.Listing memory l = market.getListing(tokenId);
        assertEq(l.price, 123 ether);
    }
}

