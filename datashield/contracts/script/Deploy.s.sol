// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import "../contracts/DataSealNFT.sol";
import "../contracts/DataMarket.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        uint256 oraclePk = vm.envUint("ORACLE_PRIVATE_KEY");
        address oracle = vm.addr(oraclePk);
        address ogToken = vm.envOr("OG_TOKEN_ADDRESS", address(0x0000000000000000000000000000000000000001));

        vm.startBroadcast(deployerPk);
        DataSealNFT nft = new DataSealNFT(oracle, oracle);
        DataMarket market = new DataMarket(address(nft), ogToken, vm.addr(deployerPk));
        vm.stopBroadcast();

        _writeDeployments(address(nft), address(market));

        console2.log("DataSealNFT:", address(nft));
        console2.log("Explorer:", string.concat("https://chainscan-galileo.0g.ai/address/", vm.toString(address(nft))));
        console2.log("DataMarket:", address(market));
        console2.log("Explorer:", string.concat("https://chainscan-galileo.0g.ai/address/", vm.toString(address(market))));
    }

    function _writeDeployments(address nft, address market) internal {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/deployments.json");

        vm.serializeAddress("deployments", "DataSealNFT", nft);
        vm.serializeAddress("deployments", "DataMarket", market);
        vm.serializeUint("deployments", "chainId", block.chainid);
        vm.serializeString("deployments", "network", "og_testnet");
        string memory json = vm.serializeUint("deployments", "updatedAt", block.timestamp);
        vm.writeJson(json, path);
    }
}
