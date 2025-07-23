const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "AccessManager"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0x07Ae51Fec39b4aC9bCf232F94f377B493476c349", "0xC7859AA7B14B2723A3b6129Bd4955D0C4f60cc1d");
    // const contract = await Contract.deploy("0x63E2D4f943cAb92D0bfC9Ab85FC9b5DeA121f39C");
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