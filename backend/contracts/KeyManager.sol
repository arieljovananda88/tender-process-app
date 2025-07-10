// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDocumentStore {
    function getDocumentOwner(string memory documentCid) external view returns (address);
}


contract KeyManager {

    IDocumentStore public documentStore;

    // Mapping from CID to receiver address to encrypted key
    mapping(string => mapping(address => string)) private encryptedKeys;
    mapping(string => mapping(address => string)) private ivs;
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
        string documentName,
        string documentFormat,
        string tenderId
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

    struct RequestAccessInput {
        address receiver;
        string tenderId;
        string cid;
        string documentName;
        string documentFormat;
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

       if (documentStore.getDocumentOwner(input.cid) != senderAddress) {
        revert(string(abi.encodePacked("Signature verification failed. Sender address: ", senderAddress)));
    }
        
        encryptedKeys[input.cid][input.receiver] = input.encryptedKey;
        ivs[input.cid][input.receiver] = input.iv;
        
        emit EmitKey(input.receiver, senderAddress, input.encryptedKey, input.iv, input.cid);
    }

    function requestAccess(RequestAccessInput memory input) external {
        bytes32 messageHash = keccak256(abi.encodePacked(input.deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address requester = ecrecover(ethSignedMessageHash, input.v, input.r, input.s);

        require(accessRequests[input.cid][requester] == false, "Access already requested");

        accessRequests[input.cid][requester] = true;

        emit RequestAccess(requester, input.receiver, input.cid, input.documentName, input.documentFormat, input.tenderId);
    }

    function getEncryptedKey(string memory cid, address receiver) external view returns (string memory, string memory) {
        return (encryptedKeys[cid][receiver], ivs[cid][receiver]);
    }

} 