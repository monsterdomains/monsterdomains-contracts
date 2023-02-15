// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import "./MIDRegistrarMigrationController.sol";
import "../registry/MID.sol";
import "../resolvers/Resolver.sol";

contract BulkMigration {
    MIDRegistrarMigrationController controller;

    constructor(MIDRegistrarMigrationController controller_) {
        controller = controller_;
    }

    function rentPrices(string[] calldata names) external view returns(uint total) {
        for(uint i = 0; i < names.length; i++) {
            total += controller.rentPrice(names[i]);
        }
    }

    function batchMigrateWithResolver(string[] memory names, address owner, address resolver) external payable {
        require(names.length > 0, "name count 0");
        for (uint i = 0; i < names.length; ++i) {
            uint cost = controller.rentPrice(names[i]);
            controller.migrateWithResolver{value: cost}(names[i], owner, resolver);
        }
    }
}
