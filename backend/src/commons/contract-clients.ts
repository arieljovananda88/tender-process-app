import { ethers } from 'ethers';
import PublicKeyStorageABI from '../../artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json';
import DocumentStoreABI from '../../artifacts/contracts/DocumentStore.sol/DocumentStore.json';

export function getPublicKeyStoregeContractInstance() {
    const API_KEY = process.env.API_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const CONTRACT_ADDRESS = process.env.PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
  
    if (!PRIVATE_KEY) {
      throw new Error("❌ PRIVATE_KEY is not set in environment variables");
    }
  
    if (!API_KEY) {
      throw new Error("❌ API_KEY is not set in environment variables");
    }
  
    if (!CONTRACT_ADDRESS) {
      throw new Error("❌ CONTRACT_ADDRESS is not set in environment variables");
    }
  
    const provider = new ethers.providers.AlchemyProvider("sepolia", API_KEY);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PublicKeyStorageABI.abi, signer);
  
    return contract;
  }

  export function getDocumentStoreContractInstance() {
    const API_KEY = process.env.API_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const CONTRACT_ADDRESS = process.env.DOCUMENT_STORE_CONTRACT_ADDRESS;
  
    if (!PRIVATE_KEY) {
      throw new Error("❌ PRIVATE_KEY is not set in environment variables");
    }
  
    if (!API_KEY) {
      throw new Error("❌ API_KEY is not set in environment variables");
    }
  
    if (!CONTRACT_ADDRESS) {
      throw new Error("❌ CONTRACT_ADDRESS is not set in environment variables");
    }
  
    const provider = new ethers.providers.AlchemyProvider("sepolia", API_KEY);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentStoreABI.abi, signer);
  
    return contract;
  }