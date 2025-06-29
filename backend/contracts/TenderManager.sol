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
    }

    mapping(string => Tender) public tenders;
    mapping(string => mapping(address => bool)) public participants;
    mapping(string => mapping(address => bool)) public pendingParticipants;

    string[] public allTenderIds;
    mapping(address => string[]) public ownerTenderIds;
    mapping(string => address[]) public tenderParticipants;
    mapping(string => address[]) public pendingTenderParticipants;

    event TenderCreated(string tenderId, address owner, string name, string description, uint256 startDate, uint256 endDate);
    event ParticipantAdded(string tenderId, address participant, string name, string email, uint256 timestamp);
    event PendingParticipantAdded(string tenderId, address participant, string name, string email, uint256 timestamp);
    event WinnerSelected(string tenderId, address winner, string reason, uint256 timestamp);
     event JoinedTender( address participant, string tenderId, address owner, string name, string description, uint256 startDate, uint256 endDate);

    function createTender(
        string memory tenderId,
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate,
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
            name: name,
            description: description,
            startDate: startDate,
            endDate: endDate,
            winner: address(0)
        });

        allTenderIds.push(tenderId);
        ownerTenderIds[ownerAddress].push(tenderId);

        emit TenderCreated(tenderId, ownerAddress, name, description, startDate, endDate);
    }

    function addPendingParticipant(string memory tenderId,  string memory name,
        string memory email, address participant) external {
        require(tenders[tenderId].owner != address(0), "Tender does not exist");
        require(!pendingParticipants[tenderId][participant], "Already marked as pending");

        pendingParticipants[tenderId][participant] = true;
        pendingTenderParticipants[tenderId].push(participant);

        Tender storage tender = tenders[tenderId];

        emit PendingParticipantAdded(tenderId, participant, name, email, block.timestamp);
        emit JoinedTender(participant, tenderId, tender.owner, tender.name, tender.description, tender.startDate, tender.endDate);
    }

    function addParticipant(
        string memory tenderId,
        address participant,
        string memory name,
        string memory email,
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

        emit ParticipantAdded(tenderId, participant, name, email, block.timestamp);
    }

    function selectWinner(string memory tenderId, address winner, string memory reason, uint8 v, bytes32 r, bytes32 s, uint256 deadline) external {
        Tender storage tender = tenders[tenderId];

        bytes32 messageHash = keccak256(abi.encodePacked(tenderId, deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address ownerAddress = ecrecover(ethSignedMessageHash, v, r, s);

        require(ownerAddress == tender.owner, "Only owner can select winner");
        // require(block.timestamp > tender.endDate, "Tender not ended");
        require(participants[tenderId][winner], "Not a participant");
        require(tender.winner == address(0), "Winner already selected");

        tender.winner = winner;
        emit WinnerSelected(tenderId, winner, reason, block.timestamp);
    }

    function isParticipant(string memory tenderId, address participant) external view returns (bool) {
        return participants[tenderId][participant];
    }

    function isPendingParticipant(string memory tenderId, address participant) external view returns (bool) {
        return pendingParticipants[tenderId][participant];
    }

    function getWinner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].winner;
    }

    function getOwner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].owner;
    }
}
