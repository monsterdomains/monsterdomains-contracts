
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../cidregistrar/StringUtils.sol";
import "../cidregistrar/MIDRegistrarController.sol";
import "./IWishlist.sol";


/**
 * To make some domains reserved for future usage
 */
contract AuctionRegistrarController is MIDRegistrarController {
    using StringUtils for *;

    bytes32 public baseNode;

    // default auction list, which will always be alive and nobody can register than till we release them
    uint256[] public auctionList;

    // wishlist contract
    IWishlist public wishlist;

    // auction period, out of which we    
    uint256 public auctionPhraseStart;
    uint256 public auctionPhraseEnd;

    event ReservedTokenAdded(uint256 indexed count);

    constructor(
        address wishlist_,
        bytes32 baseNode_,
        uint256 auctionPhraseStart_,
        uint256 auctionPhraseEnd_,
        // parent initial parameters
        BaseRegistrarImplementation base_,
        PriceOracle prices_, 
        uint minCommitmentAge_, 
        uint maxCommitmentAge_
    ) MIDRegistrarController(base_, prices_, minCommitmentAge_, maxCommitmentAge_) {
        setBaseNode(baseNode_);
        setWishlist(wishlist_);
        setAuctionPhraseTime(auctionPhraseStart_, auctionPhraseEnd_);
    }

    function setBaseNode(bytes32 baseNode_) public onlyOwner {
        require(baseNode_ != bytes32(0), "invalid parameters");
        baseNode = baseNode_;
    }

    function setWishlist(address wishlist_) public onlyOwner {
        require(wishlist_ != address(0), "invalid parameters");
        wishlist = IWishlist(wishlist_);
        // must be for the same root domain
        require(wishlist.baseNode() == baseNode, "wrong wishlist");
    }

    function setAuctionPhraseTime(uint256 auctionPhraseStart_, uint256 auctionPhraseEnd_) public onlyOwner {
        require(auctionPhraseStart_ > 0 && auctionPhraseStart_ < auctionPhraseEnd_, "invalid parameters");
        auctionPhraseStart = auctionPhraseStart_;
        auctionPhraseEnd = auctionPhraseEnd_;
    }

    function isAuctionAlive() public view returns (bool) {
        return block.timestamp > auctionPhraseStart && block.timestamp < auctionPhraseEnd;
    }

    // register a reserved name for a particular user
    // NOTE: name is label name without suffix
    function registerWithConfig(string memory name, address owner, uint duration, bytes32 secret, address resolver, address addr) public payable override {
        require(isAuctionAlive(), "auction not alive");

        // A name can be registered in reserved phrase when only one user has wished it
        require(wishlist.wishCounts(keccak256(bytes(name))) == 1, "wish count must be 1");
        require(wishlist.userHasWish(owner, name), "not owner's wish");
        
        // if user has registered, it will fail
        super.registerWithConfig(name, owner, duration, secret, resolver, addr);
    }
}