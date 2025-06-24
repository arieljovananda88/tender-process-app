const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "KeyManager"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0x29E9C2a41Db2157BCcd36f5f1d4B746c03aB8FD2");
    // const contract = await Contract.deploy("0x7D5e46588ec6B65cc2ebE9590c42875cB10fA821");
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