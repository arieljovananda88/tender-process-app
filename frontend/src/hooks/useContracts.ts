import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import TenderManagerArtifact from '../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json';
import DocumentStoreArtifact from '../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json';

type Document = {
  documentCid: string;
  documentName: string;
  documentType: string;
  submissionDate: bigint;
};

interface Participant {
    address: string
    // name: string
  }

export function useTenderManager() {
  const { address, isConnected } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const checkRegistrationStatus = async (tenderId: string) => {
    if (!address || !isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tenderManagerAddress = import.meta.env.VITE_TENDER_MANAGER_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signer);

      const resPending = await contract.isPendingParticipant(tenderId, address);
      const resRegistered = await contract.isParticipant(tenderId, address);
      const participantAddresses = await contract.getParticipants(tenderId);
      
      const formattedParticipants: Participant[] = participantAddresses.map((addr: string) => ({
        address: addr,
        name: "Unknown", 
      }));

      setIsPending(resPending);
      setIsRegistered(resRegistered);
      setParticipants(formattedParticipants);
    } catch (error) {
      console.error("Error checking registration status:", error);
    }
  };

  return {
    isPending,
    isRegistered,
    checkRegistrationStatus,
    participants
    
  };
}

export function useDocumentStore() {
  const { address, isConnected } = useAccount();
  const [documents, setDocuments] = useState<{ registrationDocuments: Document[], tenderDocuments: Document[] }>({
    registrationDocuments: [],
    tenderDocuments: []
  });

  const fetchDocuments = async (tenderId: string) => {
    if (!address || !isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const documentStoreAddress = import.meta.env.VITE_DOCUMENT_STORE_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(documentStoreAddress, DocumentStoreArtifact.abi, signer);

      const docs = await contract.getMyDocuments(tenderId);
      const registrationDocs = docs.filter((doc: Document) => doc.documentType === "Registration");
      const tenderDocs = docs.filter((doc: Document) => doc.documentType !== "Registration");
      setDocuments({ registrationDocuments: registrationDocs, tenderDocuments: tenderDocs });
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchParticipantDocuments = async (tenderId: string, participantAddress: string) => {
    if (!address || !isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const documentStoreAddress = import.meta.env.VITE_DOCUMENT_STORE_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(documentStoreAddress, DocumentStoreArtifact.abi, signer);

      const docs = await contract.getDocumentsOfTenderAsOwner(tenderId, participantAddress);
      const registrationDocs = docs.filter((doc: Document) => doc.documentType === "Registration");
      const tenderDocs = docs.filter((doc: Document) => doc.documentType !== "Registration");
      return { registrationDocuments: registrationDocs, tenderDocuments: tenderDocs };
    } catch (error) {
      console.error("Error fetching participant documents:", error);
      return { registrationDocuments: [], tenderDocuments: [] };
    }
  };

  return {
    documents,
    fetchDocuments,
    fetchParticipantDocuments
  };
} 