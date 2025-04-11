// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PublicKeyStorage {
    mapping(address => string) private walletToEmail;
    mapping(address => string) private walletToName;
    mapping(address => string) private walletToPublicKey;

    event PublicKeyStored(address indexed walletAddress, string email, string name, string publicKey);

    function storeUserInfo(
        address walletAddress,
        string memory email,
        string memory name,
        string memory publicKey
    ) external {
        walletToEmail[walletAddress] = email;
        walletToName[walletAddress] = name;
        walletToPublicKey[walletAddress] = publicKey;
        emit PublicKeyStored(walletAddress, email, name, publicKey);
    }

    function getEmail(address walletAddress) external view returns (string memory) {
        return walletToEmail[walletAddress];
    }

    function getName(address walletAddress) external view returns (string memory) {
        return walletToName[walletAddress];
    }

    function getPublicKey(address walletAddress) external view returns (string memory) {
        return walletToPublicKey[walletAddress];
    }
}
