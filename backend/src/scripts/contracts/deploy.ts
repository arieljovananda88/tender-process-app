const { ethers } = require("hardhat");

async function main() {
    const contractBeingDeployed = "KeyManager"
    const Contract = await ethers.getContractFactory(contractBeingDeployed)

    console.log(`Deploying ${contractBeingDeployed} smart contract...`);
    
    const contract = await Contract.deploy("0x8335D40d65C0EC0D3384a7960b66B4e2818Eb2e4");
    // const contract = await Contract.deploy("0x03e522f33910b5fF9Bcc6a12bCd1Aa782aa5c0c1");
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