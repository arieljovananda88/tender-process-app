// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TenderManager {
    struct Tender {
        address owner;
        string name;
        string description;
        uint256 startDate;
        uint256 endDate;
        address winner;
        bool isActive;
    }

    mapping(bytes32 => Tender) public tenders;
    mapping(bytes32 => mapping(address => bool)) public participants;

    event TenderCreated(bytes32 indexed tenderId, address owner, string name);
    event ParticipantAdded(bytes32 indexed tenderId, address participant);
    event WinnerSelected(bytes32 indexed tenderId, address winner);

    function createTender(
        bytes32 tenderId,
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate
    ) external {
        require(tenders[tenderId].owner == address(0), "Tender already exists");
        require(startDate < endDate, "Invalid dates");
        require(startDate > block.timestamp, "Start date must be in the future");

        tenders[tenderId] = Tender({
            owner: msg.sender,
            name: name,
            description: description,
            startDate: startDate,
            endDate: endDate,
            winner: address(0),
            isActive: true
        });

        emit TenderCreated(tenderId, msg.sender, name);
    }

    function addParticipant(bytes32 tenderId) external {
        require(tenders[tenderId].owner != address(0), "Tender does not exist");
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp >= tenders[tenderId].startDate, "Tender has not started");
        require(block.timestamp <= tenders[tenderId].endDate, "Tender has ended");
        require(!participants[tenderId][msg.sender], "Already a participant");

        participants[tenderId][msg.sender] = true;
        emit ParticipantAdded(tenderId, msg.sender);
    }

    function selectWinner(bytes32 tenderId, address winner) external {
        require(tenders[tenderId].owner == msg.sender, "Only owner can select winner");
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp > tenders[tenderId].endDate, "Tender has not ended");
        require(participants[tenderId][winner], "Winner must be a participant");
        require(tenders[tenderId].winner == address(0), "Winner already selected");

        tenders[tenderId].winner = winner;
        tenders[tenderId].isActive = false;
        emit WinnerSelected(tenderId, winner);
    }

    function getTender(bytes32 tenderId) external view returns (
        address owner,
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        address winner,
        bool isActive
    ) {
        Tender memory tender = tenders[tenderId];
        return (
            tender.owner,
            tender.name,
            tender.description,
            tender.startDate,
            tender.endDate,
            tender.winner,
            tender.isActive
        );
    }

    function isParticipant(bytes32 tenderId, address participant) external view returns (bool) {
        return participants[tenderId][participant];
    }
}
