// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title DataSealNFT
 * @notice DataShield — decentralised training data quality certificates
 * @dev Each NFT certifies a dataset passed 0G Compute poison detection
 *      Uploaders bond $0G tokens, slashable if fraud is proven via DA replay
 */
contract DataSealNFT is ERC721, Ownable {
    using ECDSA for bytes32;

    struct DataSeal {
        bytes32 datasetHash; // 0G Storage Merkle root hash
        bytes32 scanResultHash; // keccak256 of compute scan output bundle
        bytes32 daProofRoot; // 0G DA proof root (set after DA archival)
        uint8 score; // 0-100 cleanliness score
        uint64 timestamp;
        address uploader;
        uint256 stake; // $0G bonded in wei (min 100 $0G)
        bool slashed;
        string datasetName;
        string modelType; // e.g. "text-classification"
        uint256 sampleCount;
    }

    mapping(uint256 => DataSeal) public seals;
    mapping(bytes32 => uint256) public hashToToken;
    mapping(bytes32 => bool) public usedScanHashes;

    uint256 public nextId;
    address public slashOracle;
    address public disputeOracle;
    uint256 public minScore = 70;
    uint256 public minStake = 100 ether;
    uint256 public constant SLASH_REPORTER_BPS = 5000;

    event Sealed(uint256 indexed tokenId, bytes32 indexed datasetHash, address uploader, uint8 score, uint256 stake);
    event DAProofAnchored(uint256 indexed tokenId, bytes32 daProofRoot);
    event Slashed(uint256 indexed tokenId, address uploader, uint256 amount, address reporter);

    constructor(address _slashOracle, address _disputeOracle) ERC721("DataSeal", "DSEAL") {
        slashOracle = _slashOracle;
        disputeOracle = _disputeOracle;
    }

    function mint(
        bytes32 datasetHash,
        bytes32 scanResultHash,
        uint8 score,
        string calldata datasetName,
        string calldata modelType,
        uint256 sampleCount,
        bytes calldata oracleSig
    ) external payable returns (uint256 tokenId) {
        require(msg.value >= minStake, "DataSeal: insufficient stake");
        require(score >= minScore, "DataSeal: score below threshold");
        require(hashToToken[datasetHash] == 0, "DataSeal: dataset already sealed");
        require(!usedScanHashes[scanResultHash], "DataSeal: scan hash reused");

        _verifyOracleSig(datasetHash, scanResultHash, score, oracleSig);

        usedScanHashes[scanResultHash] = true;
        tokenId = ++nextId;

        seals[tokenId] = DataSeal({
            datasetHash: datasetHash,
            scanResultHash: scanResultHash,
            daProofRoot: bytes32(0),
            score: score,
            timestamp: uint64(block.timestamp),
            uploader: msg.sender,
            stake: msg.value,
            slashed: false,
            datasetName: datasetName,
            modelType: modelType,
            sampleCount: sampleCount
        });

        hashToToken[datasetHash] = tokenId;
        _mint(msg.sender, tokenId);
        emit Sealed(tokenId, datasetHash, msg.sender, score, msg.value);
    }

    function anchorDAProof(uint256 tokenId, bytes32 daProofRoot) external {
        require(msg.sender == slashOracle, "DataSeal: unauthorized");
        require(_ownerOf(tokenId) != address(0), "DataSeal: nonexistent");
        seals[tokenId].daProofRoot = daProofRoot;
        emit DAProofAnchored(tokenId, daProofRoot);
    }

    function slash(uint256 tokenId, address reporter) external {
        require(msg.sender == disputeOracle, "DataSeal: unauthorized");
        DataSeal storage s = seals[tokenId];
        require(!s.slashed, "DataSeal: already slashed");
        require(s.stake > 0, "DataSeal: no stake");

        s.slashed = true;
        uint256 total = s.stake;
        s.stake = 0;
        uint256 toReporter = (total * SLASH_REPORTER_BPS) / 10000;
        uint256 toBurn = total - toReporter;

        payable(reporter).transfer(toReporter);
        payable(address(0xdead)).transfer(toBurn);
        emit Slashed(tokenId, s.uploader, total, reporter);
    }

    function getSeal(uint256 tokenId) external view returns (DataSeal memory) {
        return seals[tokenId];
    }

    function isSlashed(uint256 tokenId) external view returns (bool) {
        return seals[tokenId].slashed;
    }

    function setMinScore(uint256 _min) external onlyOwner {
        minScore = _min;
    }

    function setMinStake(uint256 _min) external onlyOwner {
        minStake = _min;
    }

    function setSlashOracle(address _o) external onlyOwner {
        slashOracle = _o;
    }

    function setDisputeOracle(address _o) external onlyOwner {
        disputeOracle = _o;
    }

    function _verifyOracleSig(bytes32 dh, bytes32 srh, uint8 score, bytes calldata sig) internal view {
        bytes32 msgHash = keccak256(abi.encodePacked(dh, srh, score));
        address recovered = msgHash.toEthSignedMessageHash().recover(sig);
        require(recovered == slashOracle, "DataSeal: invalid oracle signature");
    }
}

