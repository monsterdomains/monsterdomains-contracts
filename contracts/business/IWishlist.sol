// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


interface IWishlist {
    event WishAdded(address indexed user, string indexed wish);

    function baseNode() external view returns (bytes32);

    function wishCounts(bytes32 namehash) external view returns (uint256);

    function addWish(string memory name) external;

    function needAuction(string memory name) external view returns (bool);

    function userWishes(address user) external view returns (string[] memory);

    function userHasWish(address user, string memory name) external view returns (bool);
}
