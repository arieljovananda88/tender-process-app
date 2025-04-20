import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DocumentStore
  const DocumentStore = await ethers.getContractFactory("DocumentStore");
  const documentStore = await DocumentStore.deploy();
  await documentStore.deployed();
  console.log("DocumentStore deployed to:", documentStore.address);

  // Deploy PublicKeyStorage
  const PublicKeyStorage = await ethers.getContractFactory("PublicKeyStorage");
  const publicKeyStorage = await PublicKeyStorage.deploy();
  await publicKeyStorage.deployed();
  console.log("PublicKeyStorage deployed to:", publicKeyStorage.address);

  // Deploy TenderManager
  const TenderManager = await ethers.getContractFactory("TenderManager");
  const tenderManager = await TenderManager.deploy(
    documentStore.address,
    publicKeyStorage.address
  );
  await tenderManager.deployed();
  console.log("TenderManager deployed to:", tenderManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 