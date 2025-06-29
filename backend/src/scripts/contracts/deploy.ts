const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "KeyManager"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0x07432bBbDa726C40eEAC3f3d8D0d7941c669FFa0");
    // const contract = await Contract.deploy("0x7D81B5392bF523C844c59F5f23EeF712AcF91848");
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