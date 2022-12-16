// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
import "../ResolverBase.sol";

abstract contract NameResolver is ResolverBase {
    bytes4 constant private NAME_INTERFACE_ID = 0x691f3431;

    event NameChanged(bytes32 indexed node, string name);

    mapping(bytes32=>string) names;

    /**
     * Sets the name associated with an MID node, for reverse records.
     * May only be called by the owner of that node in the MID registry.
     * @param node The node to update.
     * @param name_ The name to set.
     */
    function setName(bytes32 node, string calldata name_) external authorised(node) {
        names[node] = name_;
        emit NameChanged(node, name_);
    }

    /**
     * Returns the name associated with an MID node, for reverse records.
     * Defined in EIP181.
     * @param node The MID node to query.
     * @return The associated name.
     */
    function name(bytes32 node) external view returns (string memory) {
        return names[node];
    }

    function supportsInterface(bytes4 interfaceID) virtual override public pure returns(bool) {
        return interfaceID == NAME_INTERFACE_ID || super.supportsInterface(interfaceID);
    }
}
