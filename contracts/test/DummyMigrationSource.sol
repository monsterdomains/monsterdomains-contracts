// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

contract DummySourceRegistry {
    // namehash('bnb')
    bytes32 constant private BASE_NODE = 0xdba5666821b22671387fe7ea11d7cc41ede85a5aa67c3e7b3d68ce6a661f389c;

    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping (bytes32 => Record) records;
    mapping (address => string[]) ownerNames;

    // this is for testnet only
    function getNamesByAddress(address owner_) external view returns (string[] memory) {
        return ownerNames[owner_];
    }

    // this is for testnet only
    function setOwnerByLabelName(string memory labelname, address owner_) external {
        bytes32 node = keccak256(abi.encodePacked(BASE_NODE, keccak256(bytes(labelname))));
        ownerNames[owner_].push(labelname);
        setOwner(node, owner_);
    }

    function setOwner(bytes32 node, address owner_) public {
        records[node].owner = owner_;
    }

    function owner(bytes32 node) public view returns (address) {
        return records[node].owner;
    }
}


contract DummySourceBaseRegistrar {
    mapping (uint256 => uint256) expiries;

    // this is for testnet only
    function setNameExpiresByLabelName(string memory name_, uint256 expiry) public {
        bytes32 label = keccak256(bytes(name_));
        expiries[uint256(label)] = expiry;
    } 
    
    function setNameExpires(uint256 id, uint256 expiry) public {
        expiries[id] = expiry;
    }   
    function nameExpires(uint256 id) public view returns (uint256) {
        return expiries[id];
    }
}