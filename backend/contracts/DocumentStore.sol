// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITenderManager {
    function getOwner(string memory tenderId) external view returns (address);
    function addParticipant(string memory tenderId, string memory name, string memory email, address participant) external;
} 

contract DocumentStore {
    struct InfoDocument {
        string tenderId;
        string documentCid;
        string documentName;
        string documentFormat;
        uint256 submissionDate;
    }

     struct Document {
        address documentOwner;
        string documentCid;
        string documentName;
        string documentFormat;
        uint256 submissionDate;
        string tenderId;
        address receiver;
        string participantName;
        string participantEmail;
    }

    mapping(string => Document[]) private tenderDocuments;
    mapping(string => InfoDocument[]) private tenderInfoDocuments;

    mapping(string => address) public documentOwner;
    mapping(string => address) public documentReceiver;
    ITenderManager public tenderManager;

    event DocumentUploaded(string tenderId, address contestant, string documentCid, string documentName, string documentFormat, address receiver, string participantName, string participantEmail, uint256 submissionDate);

    constructor(address tenderManagerAddress) {
        tenderManager = ITenderManager(tenderManagerAddress);
    }

    function uploadInfoDocument(InfoDocument memory input) public {
        require(
            tenderManager.getOwner(input.tenderId) == msg.sender,
            "Only tender owner can upload tender info documents"
        );

        InfoDocument memory newDocument = InfoDocument({
            tenderId: input.tenderId,
            documentCid: input.documentCid,
            documentName: input.documentName,
            documentFormat: input.documentFormat,
            submissionDate: block.timestamp
        });

        tenderInfoDocuments[input.tenderId].push(newDocument);
    }

    function uploadDocument(Document memory input) public {
        documentOwner[input.documentCid] = msg.sender;
        documentReceiver[input.documentCid] = input.receiver;

        emit DocumentUploaded(input.tenderId, msg.sender, input.documentCid, input.documentName, input.documentFormat,  input.receiver, input.participantName, input.participantEmail, block.timestamp);
    }

    function getTenderInfoDocuments(string memory tenderId) public view returns (InfoDocument[] memory) {
        return tenderInfoDocuments[tenderId];
    }

    function getDocumentOwner(string memory documentCid) public view returns (address) {
        return documentOwner[documentCid];
    }   

    function getDocumentReceiver(string memory documentCid) public view returns (address) {
        return documentReceiver[documentCid];
    }

}
