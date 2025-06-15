// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KeyManager {
    // Mapping from CID to receiver address to encrypted key
    mapping(string => mapping(address => string)) private encryptedKeys;

    event EmitKey(
        address receiver,
        address sender,
        string encryptedKey,
        string iv,
        string cid
    );

    function emitKey(
        address receiver,
        string memory encryptedKey,
        string memory iv,
        string memory cid,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 deadline
    ) external {
        bytes32 messageHash = keccak256(abi.encodePacked(deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address senderAddress = ecrecover(ethSignedMessageHash, v, r, s);
        
        // Store the encrypted key
        encryptedKeys[cid][receiver] = encryptedKey;
        
        emit EmitKey(receiver, senderAddress, encryptedKey, iv, cid);
    }

    function getEncryptedKey(string memory cid, address receiver) external view returns (string memory) {
        return encryptedKeys[cid][receiver];
    }
} 