import dotenv from "dotenv";
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const { API_URL, PRIVATE_KEY, ARBITRUM_SEPOLIA_RPC_URL } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {},
    sepolia: {
      url: API_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
    },
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL || "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
    }
  },
};

export default config;
