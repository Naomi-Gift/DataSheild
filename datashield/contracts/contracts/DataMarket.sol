// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IDataSealNFT is IERC721 {
    function isSlashed(uint256 tokenId) external view returns (bool);
}

contract DataMarket is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        uint64 listedAt;
    }

    IDataSealNFT public immutable nft;
    IERC20 public immutable ogToken;
    address public treasury;
    uint256 public protocolFeeBps = 250;

    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed tokenId, address seller, uint256 price);
    event Delisted(uint256 indexed tokenId);
    event Purchased(uint256 indexed tokenId, address buyer, address seller, uint256 price);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    constructor(address _nft, address _ogToken, address _treasury) {
        nft = IDataSealNFT(_nft);
        ogToken = IERC20(_ogToken);
        treasury = _treasury;
    }

    function list(uint256 tokenId, uint256 price) external {
        require(nft.ownerOf(tokenId) == msg.sender, "DataMarket: not owner");
        require(!nft.isSlashed(tokenId), "DataMarket: slashed seal");
        require(price > 0, "DataMarket: zero price");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this),
            "DataMarket: not approved"
        );
        listings[tokenId] = Listing(msg.sender, price, true, uint64(block.timestamp));
        emit Listed(tokenId, msg.sender, price);
    }

    function purchase(uint256 tokenId) external nonReentrant {
        Listing storage l = listings[tokenId];
        require(l.active, "DataMarket: not listed");
        require(!nft.isSlashed(tokenId), "DataMarket: slashed seal");
        require(nft.ownerOf(tokenId) == l.seller, "DataMarket: seller changed");

        address buyer = msg.sender;
        address seller = l.seller;
        uint256 price = l.price;
        l.active = false;

        uint256 fee = (price * protocolFeeBps) / 10000;
        uint256 toSeller = price - fee;

        require(ogToken.transferFrom(buyer, seller, toSeller), "DataMarket: seller transfer failed");
        require(ogToken.transferFrom(buyer, treasury, fee), "DataMarket: fee transfer failed");
        nft.transferFrom(seller, buyer, tokenId);
        emit Purchased(tokenId, buyer, seller, price);
    }

    function delist(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "DataMarket: not seller");
        listings[tokenId].active = false;
        emit Delisted(tokenId);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        require(listings[tokenId].seller == msg.sender, "DataMarket: not seller");
        require(listings[tokenId].active, "DataMarket: not listed");
        require(newPrice > 0, "DataMarket: zero price");
        listings[tokenId].price = newPrice;
        emit PriceUpdated(tokenId, newPrice);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
}

