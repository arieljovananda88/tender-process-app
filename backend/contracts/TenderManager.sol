// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPublicKeyStorage {
    function getRole(address walletAddress) external view returns (string memory);
}

contract TenderManager {
    IPublicKeyStorage public publicKeyStorage;
    struct Tender {
        address owner;
        string name;
        uint256 startDate;
        uint256 endDate;
        address winner;
    }

    struct Participant {
        address participantAddress;
        string name;
    }

    mapping(string => Tender) public tenders;
    mapping(string => mapping(address => bool)) public thirdPartyParticipants;

    mapping(string => address[]) private thirdPartyParticipantsArray;
    mapping(string => Participant[]) public participants;

    event TenderCreated(string tenderId, address owner, string name, uint256 startDate, uint256 endDate);
    event WinnerSelected(string tenderId, address winner, string reason, uint256 timestamp);
    event ThirdPartyParticipantAdded(string tenderId, string tenderName, uint256 tenderStartDate, uint256 tenderEndDate, address thirdParty);
    event TenderMetadataAdded(
        string tenderId,
        string name,
        string department,
        string projectScope,
        string budget,  
        string qualificationRequirements,
        string submissionGuidelines,
        string officialCommunicationChannel
    );

    constructor(address publicKeyStorageAddress) {
        publicKeyStorage = IPublicKeyStorage(publicKeyStorageAddress);
    }

    function createTender(
        string memory tenderId,
        string memory name,
        uint256 startDate,
        uint256 endDate
    ) external {
        // require(startDate < endDate, "Invalid dates"); // TODO: Uncomment this  
       require(
            keccak256(abi.encodePacked(publicKeyStorage.getRole(msg.sender))) == keccak256(abi.encodePacked("organizer")),
            "Only organizer role can create tender"
        );

        tenders[tenderId] = Tender({
            owner: msg.sender,
            name: name,
            startDate: startDate,
            endDate: endDate,
            winner: address(0)
        });

        emit TenderCreated(tenderId, msg.sender, name, startDate, endDate);
    }

    function selectWinner(string memory tenderId, address winner, string memory reason, Participant[] memory participantsList) external {
        Tender storage tender = tenders[tenderId];

        require(msg.sender == tender.owner, "Only owner can select winner");
        // require(block.timestamp > tender.endDate, "Tender not ended");
        // require(participants[tenderId][winner], "Not a participant");
        require(tender.winner == address(0), "Winner already selected");

        tender.winner = winner;

        for (uint256 i = 0; i < participantsList.length; i++) {
            participants[tenderId].push(participantsList[i]);
        }

        emit WinnerSelected(tenderId, winner, reason, block.timestamp);
    }

    function addThirdPartyParticipant(string memory tenderId, address thirdParty) external {
        Tender storage tender = tenders[tenderId];
        require(msg.sender == tender.owner, "Only owner can add third party participant");
        
        // Check if already exists
        require(!thirdPartyParticipants[tenderId][thirdParty], "Third party already added");
        
        thirdPartyParticipants[tenderId][thirdParty] = true;
        thirdPartyParticipantsArray[tenderId].push(thirdParty);
        
        emit ThirdPartyParticipantAdded(tenderId, tenders[tenderId].name, tenders[tenderId].startDate, tenders[tenderId].endDate, thirdParty);
    }

    function addTenderMetadata(
        string memory tenderId,
        string memory name,
        string memory department,
        string memory projectScope,
        string memory budget,
        string memory qualificationRequirements,
        string memory submissionGuidelines,
        string memory officialCommunicationChannel
    ) external {
        Tender storage tender = tenders[tenderId];
        require(msg.sender == tender.owner, "Only owner can add tender metadata");
        
        emit TenderMetadataAdded(
            tenderId,
            name,
            department,
            projectScope,
            budget,
            qualificationRequirements,
            submissionGuidelines,
            officialCommunicationChannel
        );
    }

    function getWinner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].winner;
    }

    function getOwner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].owner;
    }

    function getParticipants(string memory tenderId) external view returns (Participant[] memory) {
        return participants[tenderId];
    }

    function isThirdPartyParticipant(string memory tenderId, address thirdParty) external view returns (bool) {
        return thirdPartyParticipants[tenderId][thirdParty];
    }

    function getThirdPartyParticipantsArray(string memory tenderId) external view returns (address[] memory) {
        return thirdPartyParticipantsArray[tenderId];
    }
}