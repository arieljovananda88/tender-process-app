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
        string documentFormat;
        uint256 submissionDate;
    }

    struct UploadInput {
        string tenderId;
        string documentCid;
        string documentName;
        string documentType;
        string documentFormat;
        string participantName;
        string participantEmail;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    mapping(string => mapping(address => Document[])) public tenderDocuments;

    mapping(string => Document[]) public tenderInfoDocuments;

    ITenderManager public tenderManager;

    event DocumentUploaded(string indexed tenderId, address indexed contestant, string documentCid, string documentName, uint256 submissionDate);

    constructor(address tenderManagerAddress) {
        tenderManager = ITenderManager(tenderManagerAddress);
    }

    function uploadTenderInfoDocumentWithSignature(UploadInput memory input) public {
        // Create the message hash
        bytes32 messageHash = keccak256(abi.encodePacked(input.tenderId, input.documentName, input.deadline));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // Recover signer
        address signer = ecrecover(ethSignedMessageHash, input.v, input.r, input.s);
        require(signer != address(0), "Invalid signature");

        // Check deadline to avoid replay
        require(block.timestamp <= input.deadline, "Signature expired");

        // Validate owner
        require(
            tenderManager.getOwner(input.tenderId) == signer,
            "Only tender owner can upload tender info documents"
        );

        Document memory newDocument = Document({
            documentCid: input.documentCid,
            documentName: input.documentName,
            documentType: "info",
            documentFormat: input.documentFormat,
            submissionDate: block.timestamp
        });

        tenderInfoDocuments[input.tenderId].push(newDocument);

        emit DocumentUploaded(input.tenderId, signer, input.documentCid, input.documentName, block.timestamp);
    }



    function uploadDocumentWithSignature(UploadInput memory input) public {
        bytes32 messageHash = keccak256(abi.encodePacked(input.tenderId, input.documentName, input.deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address signer = ecrecover(ethSignedMessageHash, input.v, input.r, input.s);
        require(signer != address(0), "Invalid signature");

        require(block.timestamp <= input.deadline, "Signature expired");

        if (keccak256(bytes(input.documentType)) == keccak256(bytes("tender"))) {
            require(
                tenderManager.isParticipant(input.tenderId, signer),
                "Only participants can upload tender documents"
            );
        }

        Document memory newDocument = Document({
            documentCid: input.documentCid,
            documentName: input.documentName,
            documentType: input.documentType,
            documentFormat: input.documentFormat,
            submissionDate: block.timestamp
        });

        tenderDocuments[input.tenderId][signer].push(newDocument);

        if (!tenderManager.isParticipant(input.tenderId, signer) &&
            !tenderManager.isPendingParticipant(input.tenderId, signer)) {
            tenderManager.addPendingParticipant(input.tenderId, input.participantName, input.participantEmail, signer);
        }

        emit DocumentUploaded(input.tenderId, signer, input.documentCid, input.documentName, block.timestamp);
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

    function getTenderInfoDocuments(string memory tenderId) public view returns (Document[] memory) {
        return tenderInfoDocuments[tenderId];
    }

}
