// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITenderManager {
    function getOwner(bytes32 tenderId) external view returns (address);
}

contract DocumentStore {
    struct Document {
        string documentCid;
        string documentName;
        uint256 submissionDate;
    }

    mapping(bytes32 => mapping(address => Document[])) public tenderDocuments;

    ITenderManager public tenderManager;

    event DocumentUploaded(bytes32 indexed tenderId, address indexed contestant, string documentCid, string documentName, uint256 submissionDate);

    constructor(address tenderManagerAddress) {
        tenderManager = ITenderManager(tenderManagerAddress);
    }

    function uploadDocument(bytes32 tenderId, address contestant, string memory documentCid, string memory documentName) public {
        Document memory newDocument = Document({
            documentCid: documentCid,
            documentName: documentName,
            submissionDate: block.timestamp
        });

        tenderDocuments[tenderId][contestant].push(newDocument);

        emit DocumentUploaded(tenderId, contestant, documentCid, documentName, block.timestamp);
    }

    function getMyDocuments(bytes32 tenderId) public view returns (Document[] memory) {
        return tenderDocuments[tenderId][msg.sender];
    }

    function getMyDocument(bytes32 tenderId, uint256 index) public view returns (string memory, string memory, uint256) {
        Document memory document = tenderDocuments[tenderId][msg.sender][index];
        return (document.documentCid, document.documentName, document.submissionDate);
    }

    function getDocumentOfUserAsOwner(bytes32 tenderId, address user, uint256 index) public view returns (string memory, string memory, uint256) {
        require(tenderManager.getOwner(tenderId) == msg.sender, "Only tender owner can view this");
        Document memory document = tenderDocuments[tenderId][user][index];
        return (document.documentCid, document.documentName, document.submissionDate);
    }

    function getDocumentsOfTenderAsOwner(bytes32 tenderId, address user) public view returns (Document[] memory) {
        require(tenderManager.getOwner(tenderId) == msg.sender, "Only tender owner can view this");
        return tenderDocuments[tenderId][user];
    }
}
