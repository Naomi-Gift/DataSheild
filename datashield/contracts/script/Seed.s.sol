// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import "../contracts/DataSealNFT.sol";
import "../contracts/DataMarket.sol";
import "../src/MockOGToken.sol";

contract Seed is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        uint256 oraclePk = vm.envUint("ORACLE_PRIVATE_KEY");

        address nftAddr = vm.envAddress("DATASEAL_NFT_ADDRESS");
        address marketAddr = vm.envAddress("DATAMARKET_ADDRESS");
        address ogTokenAddr = vm.envOr("OG_TOKEN_ADDRESS", address(0));

        vm.startBroadcast(deployerPk);

        if (ogTokenAddr == address(0)) {
            MockOGToken mock = new MockOGToken();
            ogTokenAddr = address(mock);
            console2.log("Deployed MockOGToken:", ogTokenAddr);
            console2.log("Explorer:", string.concat("https://chainscan-galileo.0g.ai/address/", vm.toString(ogTokenAddr)));
        }

        DataSealNFT nft = DataSealNFT(nftAddr);
        DataMarket market = DataMarket(marketAddr);

        // Mint 3 example seals from deployer (as uploader) with valid oracle signatures.
        _mintExample(nft, oraclePk, bytes32(uint256(1)), "Clean Reviews v1", "text-classification", 1200, 88);
        _mintExample(nft, oraclePk, bytes32(uint256(2)), "Support Chats", "nlp", 5400, 76);
        _mintExample(nft, oraclePk, bytes32(uint256(3)), "Retail Transactions", "tabular", 25000, 82);

        // Approve and list token #1 for sale
        nft.setApprovalForAll(address(market), true);
        market.list(1, 50 ether);

        vm.stopBroadcast();
    }

    function _mintExample(
        DataSealNFT nft,
        uint256 oraclePk,
        bytes32 datasetHash,
        string memory datasetName,
        string memory modelType,
        uint256 sampleCount,
        uint8 score
    ) internal {
        bytes32 scanResultHash = keccak256(abi.encodePacked(datasetHash, datasetName, modelType, sampleCount, score));
        bytes32 msgHash = keccak256(abi.encodePacked(datasetHash, scanResultHash, score));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        nft.mint{value: nft.minStake()}(datasetHash, scanResultHash, score, datasetName, modelType, sampleCount, sig);
        console2.log("Minted DataSeal tokenId:", nft.hashToToken(datasetHash));
    }
}

