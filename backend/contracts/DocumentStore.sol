// SPDX-License-Identifier: MIT

pragma solidity >= 0.8.28;

contract DocumentStore {
    string public tenderId;
    string public encryptedCid;
    string public senderId;
    string public documentType;
    string public documentCreatedAt;
    
    constructor(
        string memory _tenderId,
        string memory _encryptedCid,
        string memory _senderId,
        string memory _documentType,
        string memory _documentCreatedAt
    ) {
        tenderId = _tenderId;
        encryptedCid = _encryptedCid;
        senderId = _senderId;
        documentType = _documentType;
        documentCreatedAt = _documentCreatedAt;
    }
}