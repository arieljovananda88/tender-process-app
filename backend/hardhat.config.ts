import dotenv from "dotenv";
import "@nomiclabs/hardhat-ethers";
import "@eth-optimism/hardhat-ovm";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const { API_URL, PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      url: API_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000
    },
    optimismGoerli: {
      url: process.env.OPTIMISM_GOERLI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000
    }
  },
  ovm: {
    solcVersion: "0.8.20"
  }
};

export default config;
