const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "AccessManager"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0x724F93729d04750fB58292B02E9ca246DfC38e24", "0xC7859AA7B14B2723A3b6129Bd4955D0C4f60cc1d");
    // const contract = await Contract.deploy("0x63EAcc90488623f4cB18cC6abF3108e3Ad629143");
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