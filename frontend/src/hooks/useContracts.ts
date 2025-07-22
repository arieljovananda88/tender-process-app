import { useState } from 'react';
import { getDocumentByCids, getTenderKey } from '../lib/api_the_graph';
import { Document } from "@/lib/types"
import { decryptDocumentMetadata, decryptSymmetricKey, decryptWithSymmetricKey} from '../lib/utils';
import { getDocumentStoreContract, getTenderManagerContract } from '@/lib/contracts';


export function useTenderManager() {
  const getWinner = async (tenderId: string) => {
    try {
      const contract = await getTenderManagerContract();

      return await contract.getWinner(tenderId);
    } catch (error) {
      console.error("Error checking winner status:", error);
      return false;
    }
  };

  const isParticipant = async (tenderId: string, participantAddress: string) => {
    try {
      const contract = await getTenderManagerContract();
      return await contract.isParticipant(tenderId, participantAddress);
    } catch (error) {
      console.error("Error checking participant status:", error);
      return false;
    }
  };

  const parseParticipants = async (tenderId: string, address: string, passphrase: string, expectedTenderId: string) => {
    try {
      const response = await getTenderKey(address as string);

      console.log(response)

      const cidsOfTender = []
      const mapTenderKeyToCid: { [key: string]: string } = {}
      const mapIvToCid: { [key: string]: string } = {}
      if (response && response.length > 0) {
        for (const res of response) {
          const symmetricKey = await decryptSymmetricKey(address as string, passphrase, res.encryptedKey)
          const tenderId = await decryptWithSymmetricKey(res.tenderId, symmetricKey, res.iv)
          if (tenderId === expectedTenderId) {
            cidsOfTender.push(res.cid)
            mapTenderKeyToCid[res.cid] = symmetricKey
            mapIvToCid[res.cid] = res.iv
          }
        }
      }
      
      const documents = await getDocumentByCids(cidsOfTender)
      const decryptedDocuments: any[] = []
      for (let index = 0; index < documents.length; index++) {
        const encryptedMetadata = documents[index];

        const decryptedMetadata = await decryptDocumentMetadata(
          encryptedMetadata.tenderId, 
          encryptedMetadata.documentName,  
          encryptedMetadata.documentFormat, 
          encryptedMetadata.participantName, 
          encryptedMetadata.participantEmail, 
          mapTenderKeyToCid[encryptedMetadata.documentCid], 
          mapIvToCid[encryptedMetadata.documentCid]);
        
        decryptedDocuments.push({
          tenderId: decryptedMetadata.decryptedTenderId,
          documentOwner: encryptedMetadata.contestant,
          documentName: decryptedMetadata.decryptedDocumentName,
          documentFormat: decryptedMetadata.decryptedDocumentFormat,
          participantName: decryptedMetadata.decryptedParticipantName,
          participantEmail: decryptedMetadata.decryptedParticipantEmail,
          submissionDate: encryptedMetadata.submissionDate,
          documentCid: encryptedMetadata.documentCid
        });
      }

      const filtered = decryptedDocuments.filter(doc => 
        doc.tenderId === tenderId
      );

      const participantsMap = new Map<string, { address: string; name: string; email: string }>();

      for (const doc of filtered) {
        if (!participantsMap.has(doc.documentOwner)) {
          participantsMap.set(doc.documentOwner, {
            address: doc.documentOwner,
            name: doc.participantName,
            email: doc.participantEmail
          });
        }
      }
      
      const participants = Array.from(participantsMap.values());


      return { participants, participantsMap, filtered }

    } catch (error) {
      console.error("Error parsing participant:", error);
    }
  }

  return {
    getWinner,
    isParticipant,
    parseParticipants
  };
}

export function useDocumentStore() {
  const [documents, setDocuments] = useState<{ registrationDocuments: Document[], tenderDocuments: Document[], infoDocuments: Document[] }>({
    registrationDocuments: [],
    tenderDocuments: [],
    infoDocuments: [],
  });

  const fetchParticipantDocuments = async (tenderId: string, participantAddress: string) => {
    try {
      const contract = await getDocumentStoreContract();

      // const docs = await contract.getDocumentsOfTender(tenderId, participantAddress);
      // const registrationDocs = docs.filter((doc: Document) => doc.documentType === "Registration");
      // const tenderDocs = docs.filter((doc: Document) => doc.documentType !== "Registration");
      const infoDocs = await contract.getTenderInfoDocuments(tenderId);
      return { registrationDocuments: [], tenderDocuments: [], infoDocuments: infoDocs };
    } catch (error) {
      console.error("Error fetching participant documents:", error);
      return { registrationDocuments: [], tenderDocuments: [], infoDocuments: [] };
    }
  };

  

  return {
    documents,
    fetchParticipantDocuments,
  };
} 