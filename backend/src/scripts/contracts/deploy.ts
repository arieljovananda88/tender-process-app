const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "DocumentStore"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0x772162014301545ef4E8DB2678cb8da7af90c94c");
    // const contract = await Contract.deploy();

    console.log("smart contract address: ", contract.address)

    await contract.deployed();
    
    console.log("contract deployed to:", contract.address);

}

main()
.then(() => process.exit(0))
.catch(error => {
    console.log(error)
    process.exit(1)
})