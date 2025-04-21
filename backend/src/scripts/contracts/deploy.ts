const { ethers } = require("hardhat");

async function main() {
    const Contract = await ethers.getContractFactory("PublicKeyStorage")

    console.log("Deploying DocumentStore with dummy values...");
    
    // const contract = await Contract.deploy("0xF94f0704bD710aabDE8551b6f683424a25bf4153");
    const contract = await Contract.deploy();

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