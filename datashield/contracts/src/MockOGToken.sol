// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockOGToken is ERC20 {
    constructor() ERC20("0G Token", "0G") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

