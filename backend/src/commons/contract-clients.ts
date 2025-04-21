import { ethers } from 'ethers';
import PublicKeyStorageArtifact from '../../artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json';
import DocumentStoreArtifact from '../../artifacts/contracts/DocumentStore.sol/DocumentStore.json';
import TenderManagerArtifact from '../../artifacts/contracts/TenderManager.sol/TenderManager.json';

export function getPublicKeyStoregeContractInstance() {
    const CONTRACT_ADDRESS = process.env.PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
  
    if (!CONTRACT_ADDRESS) throw new Error("PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS is missing");

    const signer = getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, PublicKeyStorageArtifact.abi, signer);
  }

  export function getDocumentStoreContractInstance() {
    const CONTRACT_ADDRESS = process.env.DOCUMENT_STORE_CONTRACT_ADDRESS;
  
    if (!CONTRACT_ADDRESS) throw new Error("DOCUMENT_STORE_CONTRACT_ADDRESS is missing");

    const signer = getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, DocumentStoreArtifact.abi, signer);
  }

  export function getTenderManagerContractInstance() {
    const CONTRACT_ADDRESS = process.env.TENDER_MANAGER_CONTRACT_ADDRESS;
  
    if (!CONTRACT_ADDRESS) throw new Error("TENDER_MANAGER_CONTRACT_ADDRESS is missing");

    const signer = getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, TenderManagerArtifact.abi, signer);
  
  }

  function getSigner(network: string = "sepolia") {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
  
    if (!PRIVATE_KEY) {
      throw new Error("❌ PRIVATE_KEY is not set in environment variables");
    }
  
    let provider;

    switch (network) {
      case "sepolia":
        if (!process.env.SEPOLIA_API_KEY) throw new Error("❌ SEPOLIA_API_KEY is missing");
        provider = new ethers.providers.AlchemyProvider("sepolia", process.env.SEPOLIA_API_KEY);
        break;
      case "arbitrum":
        if (!process.env.ARBITRUM_RPC_URL) throw new Error("❌ ARBITRUM_RPC_URL is missing");
        provider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL);
        break;
      default:
        throw new Error(`❌ Unsupported network: ${network}`);
    }
  
    return new ethers.Wallet(PRIVATE_KEY, provider);
}

  
  