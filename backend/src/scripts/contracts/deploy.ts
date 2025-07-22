const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "AccessManager"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0xf9113792a245Ee8239935d6B660d36f2007E63db", "0xC7859AA7B14B2723A3b6129Bd4955D0C4f60cc1d");
    // const contract = await Contract.deploy("0x73dFc9cDe3C090B1120CdA4812D0908d824229aA");
    // const contract = await Contract.deploy("0xC7859AA7B14B2723A3b6129Bd4955D0C4f60cc1d");
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