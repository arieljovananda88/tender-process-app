import { getTenderKey, getTenderKeyOfASender } from '../lib/api_the_graph';
import { getTenderManagerContract } from '@/lib/contracts';
import { decryptDocuments } from '@/lib/utils';

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

  const parseParticipants = async (address: string, passphrase: string, expectedTenderId: string) => {
    try {
      const response = await getTenderKey(address as string);

      const decryptedDocuments = await decryptDocuments(response, address as string, passphrase, expectedTenderId);

      const filtered = decryptedDocuments.filter(doc => 
        doc.tenderId === expectedTenderId
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
  const fetchParticipantDocuments = async (sender: string, requester: string, passphrase: string, expectedTenderId: string) => {
    try {
      const response = await getTenderKeyOfASender(requester, sender);

      const decryptedDocuments = await decryptDocuments(response, requester, passphrase, expectedTenderId);

      return decryptedDocuments;
    } catch (error) {
      console.error("Error fetching participant documents:", error);
    }
  };

  

  return {
    fetchParticipantDocuments,
  };
} 