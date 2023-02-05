// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../cidregistrar/StringUtils.sol";
import "./IWishlist.sol";

contract Wishlist is Ownable, IWishlist {
    using StringUtils for *;

    mapping (bytes32 => uint256) override public wishCounts;

    mapping (address => string[]) public wishes;

    bytes32 override public baseNode;

    // wish list limit per user
    uint256 public wishCap;

    // wishlist phrase period
    uint256 public wishPhraseStart;
    uint256 public wishPhraseEnd;

    constructor(uint256 wishCap_, uint256 wishPhraseStart_, uint256 wishPhraseEnd_, bytes32 baseNode_) {
        setWishCap(wishCap_);
        setWishPhraseTime(wishPhraseStart_, wishPhraseEnd_);
        setBaseNode(baseNode_);
    }

    function setWishCap(uint256 wishCap_) public onlyOwner {
        require(wishCap_ > 0, "invalid parameters");
        wishCap = wishCap_;
    }

    function setWishPhraseTime(uint256 wishPhraseStart_, uint256 wishPhraseEnd_) public onlyOwner {
        require(wishPhraseStart_ > 0 && wishPhraseStart_ < wishPhraseEnd_, "invalid parameters");
        wishPhraseStart = wishPhraseStart_;
        wishPhraseEnd = wishPhraseEnd_;
    }

    function setBaseNode(bytes32 baseNode_) public onlyOwner {
        require(baseNode_ != bytes32(0), "invalid parameters");
        baseNode = baseNode_;
    }

    function blocktime() public view returns (uint) {
        return block.timestamp;
    } 

    // note: name is label name without suffix
    function addWish(string memory name) override external {
        require(block.timestamp > wishPhraseStart && block.timestamp < wishPhraseEnd, "not wishlist phrase");

        // empty name not allowed
        require(name.strlen() > 0, "empty name");

        bytes32 namehash = keccak256(bytes(name));
        require(wishes[msg.sender].length < wishCap, "exceed wish cap");

        // duplicated wish is not allowed
        string[] storage names = wishes[msg.sender];
        for (uint256 i = 0; i < names.length; i++) {
            require(keccak256(bytes(names[i])) != namehash, "duplicated wish"); 
        }

        wishes[msg.sender].push(name);
        wishCounts[namehash]++;
        emit WishAdded(msg.sender, name);
    }

    // if more than 1 user wished this name, this name need auction
    function needAuction(string memory name) override external view returns (bool) {
        return wishCounts[keccak256(bytes(name))] > 1;
    }

    function userWishes(address user) override external view returns (string[] memory) {
        return wishes[user];
    }

    function userHasWish(address user, string memory name) override public view returns (bool) {
        bytes32 namehash = keccak256(bytes(name));
        string[] storage names = wishes[user];
        for (uint256 i = 0; i < names.length; i++) {
            if(keccak256(bytes(names[i])) == namehash) {
                return true;
            }
        }
        return false;
    }
}
