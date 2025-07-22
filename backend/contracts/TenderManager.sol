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

    mapping(string => Tender) public tenders;
    mapping(string => address[]) public thirdPartyParticipants;

    event TenderCreated(string tenderId, address owner, string name, uint256 startDate, uint256 endDate);
    event WinnerSelected(string tenderId, address winner, string reason, uint256 timestamp);

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

    function selectWinner(string memory tenderId, address winner, string memory reason) external {
        Tender storage tender = tenders[tenderId];

        require(msg.sender == tender.owner, "Only owner can select winner");
        // require(block.timestamp > tender.endDate, "Tender not ended");
        // require(participants[tenderId][winner], "Not a participant");
        require(tender.winner == address(0), "Winner already selected");

        tender.winner = winner;
        emit WinnerSelected(tenderId, winner, reason, block.timestamp);
    }

    function addThirdPartyParticipant(string memory tenderId, address thirdParty) external {
        Tender storage tender = tenders[tenderId];
        require(msg.sender == tender.owner, "Only owner can add third party participant");
        thirdPartyParticipants[tenderId].push(thirdParty);
    }

    function getWinner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].winner;
    }

    function getOwner(string memory tenderId) external view returns (address) {
        return tenders[tenderId].owner;
    }
}