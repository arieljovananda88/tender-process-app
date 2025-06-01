// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITenderManager {
    function getOwner(string memory tenderId) external view returns (address);
    function addPendingParticipant(string memory tenderId, string memory name, string memory email, address participant) external;
    function isParticipant(string memory tenderId, address participant) external view returns (bool);
    function isPendingParticipant(string memory tenderId, address participant) external view returns (bool);
}

contract DocumentStore {
    struct Document {
        string documentCid;
        string documentName;
        string documentType;
        uint256 submissionDate;
    }

    mapping(string => mapping(address => Document[])) public tenderDocuments;

    ITenderManager public tenderManager;

    event DocumentUploaded(string indexed tenderId, address indexed contestant, string documentCid, string documentName, uint256 submissionDate);

    constructor(address tenderManagerAddress) {
        tenderManager = ITenderManager(tenderManagerAddress);
    }


    function uploadDocumentWithSignature(
        string memory tenderId,
        string memory documentCid,
        string memory documentName,
        string memory documentType,
        string memory participantName,
        string memory participantEmail,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) public {
        // Create the message hash
        bytes32 messageHash = keccak256(abi.encodePacked(tenderId, documentCid, documentName, documentType, deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Recover signer
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        require(signer != address(0), "Invalid signature");

        // Check deadline to avoid replay
        require(block.timestamp <= deadline, "Signature expired");

        // Validate participant
        if (keccak256(bytes(documentType)) == keccak256(bytes("tender"))) {
            require(
                tenderManager.isParticipant(tenderId, signer),
                "Only participants can upload tender documents"
            );
        }

        Document memory newDocument = Document({
            documentCid: documentCid,
            documentName: documentName,
            documentType: documentType,
            submissionDate: block.timestamp
        });

        tenderDocuments[tenderId][signer].push(newDocument);

        if (!tenderManager.isParticipant(tenderId, signer) && !tenderManager.isPendingParticipant(tenderId, signer)) {
            tenderManager.addPendingParticipant(tenderId, participantName, participantEmail, signer);
        }

        emit DocumentUploaded(tenderId, signer, documentCid, documentName, block.timestamp);
    }


    function getMyDocuments(string memory tenderId) public view returns (Document[] memory) {
        return tenderDocuments[tenderId][msg.sender];
    }

    function getMyDocument(string memory tenderId, uint256 index) public view returns (string memory, string memory, uint256) {
        Document memory document = tenderDocuments[tenderId][msg.sender][index];
        return (document.documentCid, document.documentName, document.submissionDate);
    }

    function getDocumentOfUserAsOwner(string memory tenderId, address user, uint256 index) public view returns (string memory, string memory, uint256) {
        require(tenderManager.getOwner(tenderId) == msg.sender, "Only tender owner can view this");
        Document memory document = tenderDocuments[tenderId][user][index];
        return (document.documentCid, document.documentName, document.submissionDate);
    }

    function getDocumentsOfTenderAsOwner(string memory tenderId, address user) public view returns (Document[] memory) {
        require(tenderManager.getOwner(tenderId) == msg.sender, "Only tender owner can view this");
        return tenderDocuments[tenderId][user];
    }
}
