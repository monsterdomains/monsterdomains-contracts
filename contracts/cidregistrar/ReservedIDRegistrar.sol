
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

struct ReservedDomain {
    uint256 id;
    string labelName;
}

/**
 * To make some domains reserved for future usage
 */
contract ReservedIDRegistrar is Ownable {
    using BitMaps for BitMaps.BitMap;
    /**
     * @dev A set of reserved tokens for future usage
     */
    BitMaps.BitMap reservedTokenIdMap;

    /**
     * @dev Reserved names allocator
     */
    address public reservedIDRegistrar;

    /**
     * @dev For iterate token ids
     */
    ReservedDomain[] public reservedTokenIds;

    event ReservedTokenAdded(uint256 indexed count);
    event ReservedNameRegistrarChanged(address indexed registrar);

    /**
     * @dev Some names are reserved for special purposes 
     */
    function addReservedLabelNames(string[] memory labelNames) onlyOwner external {
        for (uint256 i = 0; i < labelNames.length; ++i) {
            bytes32 label = keccak256(bytes(labelNames[i]));
            uint256 id = uint256(label);
            reservedTokenIdMap.set(id);
            reservedTokenIds.push(ReservedDomain({
                id: id,
                labelName: labelNames[i]
            }));
        }
        emit ReservedTokenAdded(labelNames.length);
    }

    function getReservedDomains() external view returns (ReservedDomain[] memory results) {
        results = new ReservedDomain[](reservedTokenIds.length);
        for (uint256 i = 0; i < reservedTokenIds.length; ++i) {
            results[i] = reservedTokenIds[i];
        }
    }

    function isTokenIdReserved(uint256 id) public view returns (bool) {
        return reservedTokenIdMap.get(id);
    }

    function canRegisterReservedId(address registrar) public view returns (bool) {
        return registrar == reservedIDRegistrar;
    }
    
    function setReservedIDRegistrar(address registrar_) onlyOwner external {
        require(registrar_ != address(0), "invalid registrar");
        reservedIDRegistrar = registrar_;
        emit ReservedNameRegistrarChanged(reservedIDRegistrar);
    }
}