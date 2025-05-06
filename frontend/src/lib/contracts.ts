import { ethers } from "ethers";
import DocumentStoreArtifact from "../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json"; // your ABI here

const DOCUMENT_STORE_ADDRESS = "0x71D55279c1FB926B130dE7388f90777D1Bd0794f"; // replace with actual

export function getDocumentStoreContract(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(DOCUMENT_STORE_ADDRESS, DocumentStoreArtifact.abi, signerOrProvider);
}