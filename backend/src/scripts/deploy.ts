const { ethers } = require("hardhat");

async function main() {
    const PublicKeyStorage = await ethers.getContractFactory("PublicKeyStorage")

    console.log("Deploying DocumentStore with dummy values...");
    
    const publicKeyStorage = await PublicKeyStorage.deploy();

    console.log("smart contract address: ", publicKeyStorage.address)

    await publicKeyStorage.deployed();
    
    console.log("publicKeyStorage deployed to:", publicKeyStorage.address);

}

main()
.then(() => process.exit(0))
.catch(error => {
    console.log(error)
    process.exit(1)
})