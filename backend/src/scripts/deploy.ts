const { ethers } = require("hardhat");

async function main() {
    const DocumentStore = await ethers.getContractFactory("DocumentStore")
    // Dummy values for the DocumentStore contract
    const dummyTenderId = "TENDER-2025-001";
    const dummyEncryptedCid = "bafybeifnamfdtot2ttwsoglgoyixc4amjidw2lu7yx52euirj6s5sliije";
    const dummySenderId = "VENDOR-123";
    const dummyDocumentType = "TECHNICAL_PROPOSAL";
    const dummyDocumentCreatedAt = "2025-03-03T12:00:00Z";

    console.log("Deploying DocumentStore with dummy values...");
    
    const documentStore = await DocumentStore.deploy(
        dummyTenderId,
        dummyEncryptedCid,
        dummySenderId,
        dummyDocumentType,
        dummyDocumentCreatedAt
    );

    console.log("smart contract address: ", documentStore.address)

    await documentStore.deployed();
    
    console.log("DocumentStore deployed to:", documentStore.address);
    console.log("Tender ID:", await documentStore.tenderId());
    console.log("Encrypted CID:", await documentStore.encryptedCid());
    console.log("Sender ID:", await documentStore.senderId());
    console.log("Document Type:", await documentStore.documentType());
    console.log("Document Created At:", await documentStore.documentCreatedAt());

}

main()
.then(() => process.exit(0))
.catch(error => {
    console.log(error)
    process.exit(1)
})