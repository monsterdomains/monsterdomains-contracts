
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

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
    uint256[] public reservedTokenIds;

    event ReservedTokenAdded(uint256 indexed count);
    event ReservedNameRegistrarChanged(address indexed registrar);

    /**
     * @dev Some names are reserved for special purposes 
     */
    function addReservedTokenId(uint256[] memory ids) onlyOwner external {
        for (uint256 i = 0; i < ids.length; ++i) {
            reservedTokenIdMap.set(ids[i]);
            reservedTokenIds.push(ids[i]);
        }
        emit ReservedTokenAdded(ids.length);
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