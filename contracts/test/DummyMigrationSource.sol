// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract DummySourceRegistry {
    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping (bytes32 => Record) records;

    function setOwner(bytes32 node, address owner_) external {
        records[node].owner = owner_;
    }

    function owner(bytes32 node) public view returns (address) {
        return records[node].owner;
    }
}


contract DummySourceBaseRegistrar {
    mapping (uint256 => uint256) expiries;
    function setNameExpires(uint256 id, uint256 expiry) public {
        expiries[id] = expiry;
    }   
    function nameExpires(uint256 id) public view returns (uint256) {
        return expiries[id];
    }
}