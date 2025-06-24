// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDocumentStore {
    function getDocumentOwner(string memory documentCid) external view returns (address);
}


contract KeyManager {

    IDocumentStore public documentStore;

    // Mapping from CID to receiver address to encrypted key
    mapping(string => mapping(address => string)) private encryptedKeys;
    mapping(string => mapping(address => bool)) private accessRequests;

    event EmitKey(
        address receiver,
        address sender,
        string encryptedKey,
        string iv,
        string cid
    );

    event RequestAccess(
        address requester,
        address receiver,
        string cid,
        string fileName
    );

    struct EmitKeyInput {
        address receiver;
        string encryptedKey;
        string iv;
        string cid;
        string tenderId;
        string documentName;
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 deadline;
    }

    constructor(address documentStoreAddress) {
        documentStore = IDocumentStore(documentStoreAddress);
    }

    function emitKey(
        EmitKeyInput memory input
    ) external {
        bytes32 messageHash = keccak256(abi.encodePacked(input.tenderId, input.documentName, input.deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address senderAddress = ecrecover(ethSignedMessageHash, input.v, input.r, input.s);

        require(documentStore.getDocumentOwner(input.cid) == senderAddress, "Only document owner can emit key");
        
        encryptedKeys[input.cid][input.receiver] = input.encryptedKey;
        
        emit EmitKey(input.receiver, senderAddress, input.encryptedKey, input.iv, input.cid);
    }

    function requestAccess(address receiver, string memory cid, string memory fileName, uint8 v, bytes32 r, bytes32 s, uint256 deadline) external {
        bytes32 messageHash = keccak256(abi.encodePacked(deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address requester = ecrecover(ethSignedMessageHash, v, r, s);

        require(accessRequests[cid][receiver] == false, "Access already requested");

        accessRequests[cid][receiver] = true;

        emit RequestAccess(requester, receiver, cid, fileName);
    }

    function getEncryptedKey(string memory cid, address receiver) external view returns (string memory) {
        return encryptedKeys[cid][receiver];
    }
} 