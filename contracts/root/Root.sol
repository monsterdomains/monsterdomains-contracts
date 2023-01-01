// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../registry/MID.sol";
import "./Controllable.sol";

contract Root is Ownable, Controllable {
    bytes32 constant private ROOT_NODE = bytes32(0);

    bytes4 constant private INTERFACE_META_ID = bytes4(keccak256("supportsInterface(bytes4)"));

    event TLDLocked(bytes32 indexed label);

    MID public mid;
    mapping(bytes32=>bool) public locked;

    constructor(MID _mid) {
        mid = _mid;
    }

    function setSubnodeOwner(bytes32 label, address owner) external onlyController {
        require(!locked[label], "locked");
        mid.setSubnodeOwner(ROOT_NODE, label, owner);
    }

    function setResolver(address resolver) external onlyOwner {
        mid.setResolver(ROOT_NODE, resolver);
    }

    function lock(bytes32 label) external onlyOwner {
        emit TLDLocked(label);
        locked[label] = true;
    }

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return interfaceID == INTERFACE_META_ID;
    }
}
