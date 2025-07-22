import { ethers } from "ethers";

export async function getDocumentStoreContract() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const documentStoreAddress = import.meta.env.VITE_DOCUMENT_STORE_CONTRACT_ADDRESS;
  const DocumentStoreArtifact = await import('../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json');
  return new ethers.Contract(documentStoreAddress, DocumentStoreArtifact.abi, signer);
}

export async function getTenderManagerContract() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const tenderManagerAddress = import.meta.env.VITE_TENDER_MANAGER_CONTRACT_ADDRESS;
  const TenderManagerArtifact = await import('../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json');
  return new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signer);
}

export async function getPublicKeyStorageContract() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const publicKeyStorageAddress = import.meta.env.VITE_PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
  const PublicKeyStorageArtifact = await import('../../../backend/artifacts/contracts/PublicKeyStore.sol/PublicKeyStore.json');
  return new ethers.Contract(publicKeyStorageAddress, PublicKeyStorageArtifact.abi, signer);
}

export async function getAccessManagerContract() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const accessManagerAddress = import.meta.env.VITE_ACCESS_MANAGER_CONTRACT_ADDRESS;
  const AccessManagerArtifact = await import('../../../backend/artifacts/contracts/AccessManager.sol/AccessManager.json');
  return new ethers.Contract(accessManagerAddress, AccessManagerArtifact.abi, signer);
}
