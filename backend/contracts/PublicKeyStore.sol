// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PublicKeyStore {

    struct UserInfo {
        string email;
        string name;
        string publicKey;
        string role;
    }

    mapping(address => UserInfo) private userInfo;

    mapping(string => bool) private emailToExists;
    mapping(string => bool) private nameToExists;

    event PublicKeyStored(address indexed walletAddress, string email, string name, string publicKey, string role);

    function storeUserInfo(
        address walletAddress,
        string memory email,
        string memory name,
        string memory publicKey,
        string memory role
    ) external {
        require(!emailToExists[email], "Email already exists");
        require(!nameToExists[name], "Name already exists");
        require(bytes(email).length > 0, "Email cannot be empty");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(publicKey).length > 0, "Public key cannot be empty");
        require(bytes(role).length > 0, "Role cannot be empty");
        require(keccak256(bytes(role)) == keccak256(bytes("organizer")) || keccak256(bytes(role)) == keccak256(bytes("participant")) || keccak256(bytes(role)) == keccak256(bytes("third_party")), "Invalid role");

        userInfo[walletAddress] = UserInfo(email, name, publicKey, role);
        emailToExists[email] = true;
        nameToExists[name] = true;

        emit PublicKeyStored(walletAddress, email, name, publicKey, role);
    }

    function getEmail(address walletAddress) external view returns (string memory) {
        return userInfo[walletAddress].email;
    }

    function getName(address walletAddress) external view returns (string memory) {
        return userInfo[walletAddress].name;
    }

    function getPublicKey(address walletAddress) external view returns (string memory) {
        return userInfo[walletAddress].publicKey;
    }

    function getRole(address walletAddress) external view returns (string memory) {
        return userInfo[walletAddress].role;
    }
    
    
}
