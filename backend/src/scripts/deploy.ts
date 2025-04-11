const { ethers } = require("hardhat");

async function main() {
    const Contract = await ethers.getContractFactory("DocumentStore")

    console.log("Deploying DocumentStore with dummy values...");
    
    const contract = await Contract.deploy("0x80b2BB2eD3fb0A1950256Cf40533E751059D33aF");

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