// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PublicKeyStorage {

    // Mapping to store the public key and name for each wallet address
    mapping(address => string) public walletToPublicKey;
    mapping(address => string) public walletToName;

    // Event to emit when a public key and name are stored for the first time
    event PublicKeyStored(address indexed walletAddress, string publicKey, string name);

    // Function to store public key, name, and address for the first time login
    function storePublicKey(address walletAddress, string memory publicKey, string memory name) external {
        walletToPublicKey[walletAddress] = publicKey;
        walletToName[walletAddress] = name;
        emit PublicKeyStored(walletAddress, publicKey, name);
    }

    // Function to get the public key for a wallet address
    function getPublicKey(address walletAddress) external view returns (string memory) {
        return walletToPublicKey[walletAddress];
    }

    // Function to get the name associated with a wallet address
    function getName(address walletAddress) external view returns (string memory) {
        return walletToName[walletAddress];
    }
}
