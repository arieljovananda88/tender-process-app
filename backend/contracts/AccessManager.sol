// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDocumentStore {
    function getDocumentOwner(string memory documentCid) external view returns (address);
    function getDocumentReceiver(string memory documentCid) external view returns (address);
}

interface IPublicKeyStorage {
    function getRole(address walletAddress) external view returns (string memory);
}


contract AccessManager {

    IDocumentStore public documentStore;
    IPublicKeyStorage public publicKeyStorage;

    // Mapping from CID to receiver address to encrypted key
    mapping(string => mapping(address => string)) private encryptedContentKeys;
    mapping(string => mapping(address => string)) private contentIvs;
    mapping(string => mapping(address => bool)) private accessContentRequests;

    mapping(string => mapping(address => string)) private encryptedTenderKeys;
    mapping(string => mapping(address => string)) private tenderIvs;
    mapping(string => mapping(address => bool)) private accessTenderRequests;


    event EmitContentKey(
        address receiver,
        address sender,
        string encryptedKey,
        string iv,
        string cid
    );
    
    event EmitTenderKey(
        address receiver,
        address sender,
        string encryptedKey,
        string iv,
        string cid,
        string tenderId
    );

    event RequestAccessContent(
        address requester,
        address receiver,
        string cid
    );

    event RequestAccessTender(
        address requester,
        address receiver,
        string tenderId,
        string tenderName,
        string tenderStartDate,
        string tenderEndDate
    );

    struct EmitKeyInput {
        address receiver;
        string encryptedKey;
        string iv;
        string cid;
    }

    struct EmitTenderKeyInput {
        address receiver;
        string encryptedKey;
        string iv;
        string cid;
        string tenderId;
    }
    
    struct RequestAccessInput {
        address receiver;
        string cid;
    }

    struct EmitCombinedKeyInput {
        EmitKeyInput contentKey;
        EmitTenderKeyInput tenderKey;
    }

    constructor(address documentStoreAddress, address publicKeyStorageAddress) {
        documentStore = IDocumentStore(documentStoreAddress);
        publicKeyStorage = IPublicKeyStorage(publicKeyStorageAddress);
    }

    function emitContentKey(
        EmitKeyInput memory input
    ) external {
        bool isDocumentOwner = documentStore.getDocumentOwner(input.cid) == msg.sender;
        bool isDocumentReceiver = documentStore.getDocumentReceiver(input.cid) == msg.sender;
        
        if (!isDocumentOwner && !isDocumentReceiver) {
            revert(string(abi.encodePacked("Sender is not authorized to emit content key")));
        }

        encryptedContentKeys[input.cid][input.receiver] = input.encryptedKey;
        contentIvs[input.cid][input.receiver] = input.iv;
        
        emit EmitContentKey(input.receiver, msg.sender, input.encryptedKey, input.iv, input.cid);
    }

    function requestAccessContent(RequestAccessInput memory input) external {
        if (keccak256(abi.encodePacked(publicKeyStorage.getRole(msg.sender))) != keccak256(abi.encodePacked("third_party"))) {
            revert(string(abi.encodePacked("Sender is not a third_party")));
        }

        require(accessContentRequests[input.cid][msg.sender] == false, "Access already requested");

        accessContentRequests[input.cid][msg.sender] = true;

        emit RequestAccessContent(msg.sender, input.receiver, input.cid);
    }


    function emitTenderKey(
        EmitTenderKeyInput[] memory inputs
    ) external {
        for (uint i = 0; i < inputs.length; i++) {
            bool isDocumentOwner = documentStore.getDocumentOwner(inputs[i].cid) == msg.sender;
            bool isDocumentReceiver = documentStore.getDocumentReceiver(inputs[i].cid) == msg.sender;
            if (!isDocumentOwner && !isDocumentReceiver) {
            revert(string(abi.encodePacked("Sender is not authorized to emit tender key")));
        }
        
        encryptedTenderKeys[inputs[i].cid][inputs[i].receiver] = inputs[i].encryptedKey;
        tenderIvs[inputs[i].cid][inputs[i].receiver] = inputs[i].iv;
        
        emit EmitTenderKey(inputs[i].receiver, msg.sender, inputs[i].encryptedKey, inputs[i].iv, inputs[i].cid, inputs[i].tenderId);
        }
    }

    function emitCombinedKeys(
        EmitCombinedKeyInput[] memory inputs
    ) external {
        for (uint i = 0; i < inputs.length; i++) {
            bool isDocumentOwner = documentStore.getDocumentOwner(inputs[i].contentKey.cid) == msg.sender;
            bool isDocumentReceiver = documentStore.getDocumentReceiver(inputs[i].contentKey.cid) == msg.sender;
        
        if (!isDocumentOwner && !isDocumentReceiver) {
            revert(string(abi.encodePacked("Sender is not authorized to emit keys")));
        }

        // Emit content key
        encryptedContentKeys[inputs[i].contentKey.cid][inputs[i].contentKey.receiver] = inputs[i].contentKey.encryptedKey;
        contentIvs[inputs[i].contentKey.cid][inputs[i].contentKey.receiver] = inputs[i].contentKey.iv;
        emit EmitContentKey(inputs[i].contentKey.receiver, msg.sender, inputs[i].contentKey.encryptedKey, inputs[i].contentKey.iv, inputs[i].contentKey.cid);

        // Emit tender key
        encryptedTenderKeys[inputs[i].tenderKey.cid][inputs[i].tenderKey.receiver] = inputs[i].tenderKey.encryptedKey;
        tenderIvs[inputs[i].tenderKey.cid][inputs[i].tenderKey.receiver] = inputs[i].tenderKey.iv;
        emit EmitTenderKey(inputs[i].tenderKey.receiver, msg.sender, inputs[i].tenderKey.encryptedKey, inputs[i].tenderKey.iv, inputs[i].tenderKey.cid, inputs[i].tenderKey.tenderId);
        }
    }

    function requestAccessTender(string memory tenderId, string memory tenderName, string memory tenderStartDate, string memory tenderEndDate, address receiver) external {
        if (keccak256(abi.encodePacked(publicKeyStorage.getRole(msg.sender))) != keccak256(abi.encodePacked("third_party"))) {
            revert(string(abi.encodePacked("Sender is not a third_party")));
        }

        require(accessTenderRequests[tenderId][msg.sender] == false, "Access already requested");

        accessTenderRequests[tenderId][msg.sender] = true;

        emit RequestAccessTender(msg.sender, receiver, tenderId, tenderName, tenderStartDate, tenderEndDate);
    }

    function getEncryptedContentKey(string memory cid, address receiver) external view returns (string memory, string memory) {
        return (encryptedContentKeys[cid][receiver], contentIvs[cid][receiver]);
    }

    function getEncryptedTenderKey(string memory tenderId, address receiver) external view returns (string memory, string memory) {
        return (encryptedTenderKeys[tenderId][receiver], tenderIvs[tenderId][receiver]);
    }

} 