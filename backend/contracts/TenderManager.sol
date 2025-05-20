// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TenderManager {
    struct Tender {
        address owner;
        uint256 startDate;
        uint256 endDate;
        address winner;
        string tenderCID;
    }

    mapping(string => Tender) public tenders;
    mapping(string => mapping(address => bool)) public participants;
    mapping(string => mapping(address => bool)) public pendingParticipants;

    string[] public allTenderIds;
    mapping(address => string[]) public ownerTenderIds;
    mapping(string => address[]) public tenderParticipants;
    mapping(string => address[]) public pendingTenderParticipants;

    event TenderCreated(string indexed tenderId, address owner, string tenderCID);
    event ParticipantAdded(string indexed tenderId, address participant);
    event WinnerSelected(string indexed tenderId, address winner);

    function createTender(
        string memory tenderId,
        uint256 startDate,
        uint256 endDate,
        string memory tenderCID,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 deadline
    ) external {
        require(startDate < endDate, "Invalid dates");

        bytes32 messageHash = keccak256(abi.encodePacked(deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address ownerAddress = ecrecover(ethSignedMessageHash, v, r, s);

        tenders[tenderId] = Tender({
            owner: ownerAddress,
            startDate: startDate,
            endDate: endDate,
            winner: address(0),
            tenderCID: tenderCID
        });

        allTenderIds.push(tenderId);
        ownerTenderIds[ownerAddress].push(tenderId);

        emit TenderCreated(tenderId, ownerAddress, tenderCID);
    }

    function addPendingParticipant(string memory tenderId, address participant) external {
        require(tenders[tenderId].owner != address(0), "Tender does not exist");
        require(!pendingParticipants[tenderId][participant], "Already marked as pending");

        pendingParticipants[tenderId][participant] = true;
        pendingTenderParticipants[tenderId].push(participant);
    }

    function addParticipant(
        string memory tenderId,
        address participant,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 deadline
    ) external {
        Tender memory tender = tenders[tenderId];
        require(tender.owner != address(0), "Tender does not exist");

        bytes32 messageHash = keccak256(abi.encodePacked(tenderId, deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address recovered = ecrecover(ethSignedMessageHash, v, r, s);

        require(recovered == tender.owner, "Invalid signature");
        require(block.timestamp >= tender.startDate, "Tender not started");
        require(block.timestamp <= tender.endDate, "Tender ended");
        require(!participants[tenderId][participant], "Already a participant");

        participants[tenderId][participant] = true;
        pendingParticipants[tenderId][participant] = false;
        tenderParticipants[tenderId].push(participant);

        // Clean up from pending
        address[] storage pending = pendingTenderParticipants[tenderId];
        for (uint i = 0; i < pending.length; i++) {
            if (pending[i] == participant) {
                pending[i] = pending[pending.length - 1];
                pending.pop();
                break;
            }
        }

        emit ParticipantAdded(tenderId, participant);
    }

    function selectWinner(string memory tenderId, address winner) external {
        Tender storage tender = tenders[tenderId];
        require(msg.sender == tender.owner, "Only owner can select winner");
        require(block.timestamp > tender.endDate, "Tender not ended");
        require(participants[tenderId][winner], "Not a participant");
        require(tender.winner == address(0), "Winner already selected");

        tender.winner = winner;
        emit WinnerSelected(tenderId, winner);
    }

    function getParticipants(string memory tenderId) external view returns (address[] memory) {
        return tenderParticipants[tenderId];
    }

    function getPendingParticipants(string memory tenderId) external view returns (address[] memory) {
        return pendingTenderParticipants[tenderId];
    }

    function isParticipant(string memory tenderId, address participant) external view returns (bool) {
        return participants[tenderId][participant];
    }

    function isPendingParticipant(string memory tenderId, address participant) external view returns (bool) {
        return pendingParticipants[tenderId][participant];
    }

    function getTendersByOwner(address owner, uint256 page, uint256 pageSize)
        external
        view
        returns (string[] memory tenderIds, Tender[] memory tenderDetails)
    {
        require(page > 0, "Invalid page");

        uint256 start = (page - 1) * pageSize;
        uint256 end = start + pageSize;
        string[] storage ownerTenders = ownerTenderIds[owner];
        if (end > ownerTenders.length) end = ownerTenders.length;

        uint256 resultSize = end - start;
        tenderIds = new string[](resultSize);
        tenderDetails = new Tender[](resultSize);

        for (uint i = start; i < end; i++) {
            string memory id = ownerTenders[i];
            tenderIds[i - start] = id;
            tenderDetails[i - start] = tenders[id];
        }
    }

    function getAllTenders(uint256 page, uint256 pageSize)
        external
        view
        returns (string[] memory tenderIds, Tender[] memory tenderDetails)
    {
        require(page > 0, "Invalid page");

        uint256 start = (page - 1) * pageSize;
        uint256 end = start + pageSize;
        if (end > allTenderIds.length) end = allTenderIds.length;

        uint256 resultSize = end - start;
        tenderIds = new string[](resultSize);
        tenderDetails = new Tender[](resultSize);

        for (uint i = start; i < end; i++) {
            string memory id = allTenderIds[i];
            tenderIds[i - start] = id;
            tenderDetails[i - start] = tenders[id];
        }
    }

    function getTenderCID(string memory tenderId) external view returns (string memory) {
        return tenders[tenderId].tenderCID;
    }

    function getOwner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].owner;
    }

    function getWinner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].winner;
    }

    function isActive(string memory tenderId) external view returns (bool) {
        Tender memory tender = tenders[tenderId];
        return block.timestamp >= tender.startDate && block.timestamp <= tender.endDate;
    }
}
