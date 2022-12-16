// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./MID.sol";

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract FIFSRegistrar {
    MID mid;
    bytes32 rootNode;

    modifier only_owner(bytes32 label) {
        address currentOwner = mid.owner(keccak256(abi.encodePacked(rootNode, label)));
        require(currentOwner == address(0x0) || currentOwner == msg.sender);
        _;
    }

    /**
     * Constructor.
     * @param ensAddr The address of the MID registry.
     * @param node The node that this registrar administers.
     */
    constructor(MID ensAddr, bytes32 node) {
        mid = ensAddr;
        rootNode = node;
    }

    /**
     * Register a name, or change the owner of an existing registration.
     * @param label The hash of the label to register.
     * @param owner The address of the new owner.
     */
    function register(bytes32 label, address owner) public only_owner(label) {
        mid.setSubnodeOwner(rootNode, label, owner);
    }
}
