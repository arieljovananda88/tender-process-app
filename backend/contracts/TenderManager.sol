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

    // Nested mapping: owner => tenderId => Tender
    mapping(address => mapping(string => Tender)) public tenders;

    mapping(string => mapping(address => bool)) public participants;
    
    // Track all tender IDs for pagination
    string[] public allTenderIds;
    mapping(address => string[]) public ownerTenderIds;
    
    // Map tenderId to owner address for quick lookups
    mapping(string => address) public tenderToOwner;

    // Track all participants for each tender
    mapping(string => address[]) public tenderParticipants;

    event TenderCreated(string indexed tenderId, address owner, string name);
    event ParticipantAdded(string indexed tenderId, address participant);
    event WinnerSelected(string indexed tenderId, address winner);

    function getOwner(string memory tenderId) external view returns (address) {
        return tenderToOwner[tenderId];
    }

    function createTender(
        string memory tenderId,
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        address owner
    ) external {
        require(startDate < endDate, "Invalid dates");
        require(startDate > block.timestamp, "Start date must be in the future");

        tenders[owner][tenderId] = Tender({
            owner: owner,
            name: name,
            description: description,
            startDate: startDate,
            endDate: endDate,
            winner: address(0),
            isActive: true
        });

        // Add to tracking arrays and mappings
        allTenderIds.push(tenderId);
        ownerTenderIds[owner].push(tenderId);
        tenderToOwner[tenderId] = owner;

        emit TenderCreated(tenderId, owner, name);
    }

    function addParticipant(
        string memory tenderId,
        address owner,
        address participant
    ) external {
        require(tenderToOwner[tenderId] == owner, "Only owner can add participants");
        require(tenders[owner][tenderId].isActive, "Tender is not active");
        require(block.timestamp >= tenders[owner][tenderId].startDate, "Tender has not started");
        require(block.timestamp <= tenders[owner][tenderId].endDate, "Tender has ended");
        require(!participants[tenderId][participant], "Already a participant");

        participants[tenderId][participant] = true;
        tenderParticipants[tenderId].push(participant);
        emit ParticipantAdded(tenderId, participant);
    }

    function selectWinner(
        string memory tenderId,
        address owner,
        address winner
    ) external {
        require(tenderToOwner[tenderId] == owner, "Only owner can select winner");
        require(tenders[owner][tenderId].isActive, "Tender is not active");
        require(block.timestamp > tenders[owner][tenderId].endDate, "Tender has not ended");
        require(participants[tenderId][winner], "Winner must be a participant");
        require(tenders[owner][tenderId].winner == address(0), "Winner already selected");

        tenders[owner][tenderId].winner = winner;
        tenders[owner][tenderId].isActive = false;
        emit WinnerSelected(tenderId, winner);
    }

    function getTender(string memory tenderId) external view returns (
        address owner,
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        address winner,
        bool isActive
    ) {
        address owner = tenderToOwner[tenderId];
        require(owner != address(0), "Tender does not exist");
        
        Tender memory tender = tenders[owner][tenderId];
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

    function getTendersByOwner(address owner, uint256 page, uint256 pageSize) external view returns (
        string[] memory tenderIds,
        Tender[] memory tenderDetails
    ) {
        require(page > 0, "Page must be greater than 0");
        uint256 start = (page - 1) * pageSize;
        uint256 end = start + pageSize;
        
        if (end > ownerTenderIds[owner].length) {
            end = ownerTenderIds[owner].length;
        }
        
        uint256 resultSize = end - start;
        tenderIds = new string[](resultSize);
        tenderDetails = new Tender[](resultSize);
        
        for (uint256 i = start; i < end; i++) {
            string memory tenderId = ownerTenderIds[owner][i];
            tenderIds[i - start] = tenderId;
            tenderDetails[i - start] = tenders[owner][tenderId];
        }
        
        return (tenderIds, tenderDetails);
    }

    function getAllTenders(uint256 page, uint256 pageSize) external view returns (
        string[] memory tenderIds,
        Tender[] memory tenderDetails
    ) {
        require(page > 0, "Page must be greater than 0");
        uint256 start = (page - 1) * pageSize;
        uint256 end = start + pageSize;
        
        if (end > allTenderIds.length) {
            end = allTenderIds.length;
        }
        
        uint256 resultSize = end - start;
        tenderIds = new string[](resultSize);
        tenderDetails = new Tender[](resultSize);
        
        for (uint256 i = start; i < end; i++) {
            string memory tenderId = allTenderIds[i];
            address owner = tenderToOwner[tenderId];
            tenderIds[i - start] = tenderId;
            tenderDetails[i - start] = tenders[owner][tenderId];
        }
        
        return (tenderIds, tenderDetails);
    }

    function isParticipant(string memory tenderId, address participant) external view returns (bool) {
        return participants[tenderId][participant];
    }

    function getParticipants(string memory tenderId) external view returns (address[] memory) {
        require(tenderToOwner[tenderId] != address(0), "Tender does not exist");
        return tenderParticipants[tenderId];
    }
}
