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

  function getSigner() {
    const API_KEY = process.env.API_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
  
    if (!PRIVATE_KEY) {
      throw new Error("❌ PRIVATE_KEY is not set in environment variables");
    }
  
    if (!API_KEY) {
      throw new Error("❌ API_KEY is not set in environment variables");
    }
  
    const provider = new ethers.providers.AlchemyProvider("sepolia", API_KEY);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
    return signer;
  }