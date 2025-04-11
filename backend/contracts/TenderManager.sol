// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TenderManager {
    mapping(bytes32 => address) public tenderOwner;

    function createTender(bytes32 tenderId) external {
        require(tenderOwner[tenderId] == address(0), "Tender already exists");
        tenderOwner[tenderId] = msg.sender;
    }

    function getOwner(bytes32 tenderId) external view returns (address) {
        return tenderOwner[tenderId];
    }
}
