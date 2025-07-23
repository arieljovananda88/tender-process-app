import { encryptWithPublicKey, initIPFSClient, uploadToIPFSClientEncrypted, generateTenderId, encryptDocumentMetadata } from './utils';
import { getPublicKeyStorageContract, getTenderManagerContract, getAccessManagerContract, getDocumentStoreContract } from './contracts';
import { CreateTenderResponse, UploadDocumentResponse, SelectWinnerResponse, RequestAccessResponse, RegisterResponse, UploadInfoDocumentParams, UploadDocumentParams, SelectWinnerParticipant, TenderMetadata } from './types';
import { getTenderKey } from './api_the_graph';
import { decryptTenderKey } from './utils';

export async function createTender( 
  name: string,
  startDate: string,
  endDate: string,
  ): Promise<CreateTenderResponse> {
  try {
    const contract = await getTenderManagerContract();

    // Generate tenderId using timestamp and random number
    const tenderId = generateTenderId();

    // Convert dates to Unix timestamp
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

    // Call the smart contract
    const tx = await contract.createTender(
      tenderId,
      name,
      startTimestamp,
      endTimestamp,
    );

    // Wait for transaction to be mined
    await tx.wait();

    return {
      success: true,
      message: "Tender created successfully",
      tenderId: tenderId
    };
  } catch (error: any) {
    console.error("Create tender error:", error);
    throw new Error(`Failed to create tender: ${error.message}`);
  }
}

export async function registerUser(name: string, email: string, address: string, publicKey: string, role: string): Promise<RegisterResponse> {
  try {
    if (!email || !address || !name || !publicKey) {
        throw new Error("Missing email, address or name");
    }

    const contract = await getPublicKeyStorageContract(); 

    const publicKeyInContract = await contract.getPublicKey(address);
    if (publicKeyInContract) {
        throw new Error("Public key has already been registered");
    }

    await contract.storeUserInfo(address, email, name, publicKey, role);

    return {
      success: true,
    };
} catch (error: any) {
    console.error("registration error:", error);
    throw new Error(`Failed to register user: ${error.message}`);
}
}

export async function checkIsRegistered(address: string): Promise<boolean> {
  try {
    const contract = await getPublicKeyStorageContract(); 

    const publicKeyInContract = await contract.getPublicKey(address);
    if (!publicKeyInContract) {
      return false;
    }
  
    return true;
  } catch (error: any) {
    console.error("Check is registered error:", error);
    throw new Error(`Failed to check is registered: ${error.message}`);
  }
}

export async function uploadDocument(params: UploadDocumentParams): Promise<UploadDocumentResponse> {
  if (!params.tenderId || !params.documentName || !params.documentType || !params.participantName || !params.participantEmail || !params.documentFormat) {
    throw new Error("Missing required fields");
  }

  try {
    const tenderManagerContract = await getTenderManagerContract();
    const publicKeyStorageContract = await getPublicKeyStorageContract();
    const documentContract = await getDocumentStoreContract();
    const accessManagerContract = await getAccessManagerContract();

    const tenderOwner = await tenderManagerContract.getOwner(params.tenderId);

    // Upload and encrypt file to IPFS
    const { cid, key, iv } = await uploadToIPFSClientEncrypted(params.document);

    // Upload document with signature to smart contract
    const encryptedDocumentMetadata = await encryptDocumentMetadata(params.tenderId, params.documentName, params.documentType, params.documentFormat, params.participantName, params.participantEmail);

          // encrypt document with public key of receiver
    const uploadInput = {
      documentOwner: params.signer,
      documentCid: cid,
      documentName: encryptedDocumentMetadata.encryptedDocumentName,
      documentFormat: encryptedDocumentMetadata.encryptedDocumentFormat,
      submissionDate: new Date().getDate(),
      tenderId: encryptedDocumentMetadata.encryptedTenderId,
      receiver: tenderOwner,
      participantName: encryptedDocumentMetadata.encryptedParticipantName,
      participantEmail: encryptedDocumentMetadata.encryptedParticipantEmail,
    };

    const uploadDocumentTx = await documentContract.uploadDocument(uploadInput);
    await uploadDocumentTx.wait()

    const ownerPublicKeyInContract = await publicKeyStorageContract.getPublicKey(tenderOwner);
    const participantPublicKeyInContract = await publicKeyStorageContract.getPublicKey(params.signer);

    const ownerJwk = JSON.parse(ownerPublicKeyInContract);
    const participantJwk = JSON.parse(participantPublicKeyInContract);


    const ownerEncryptedContentKey = await encryptWithPublicKey(key, ownerJwk)

    const ownerEncryptedTenderKey = await encryptWithPublicKey(encryptedDocumentMetadata.keyString, ownerJwk)

    const participantEncryptedContentKey = await encryptWithPublicKey(key, participantJwk)

    const participantEncryptedTenderKey = await encryptWithPublicKey(encryptedDocumentMetadata.keyString, participantJwk)


    const thirdPartyParticipants = await tenderManagerContract.getThirdPartyParticipantsArray(params.tenderId);

    const tenderKeysForThirdPartyParticipants = []

    for (const thirdPartyParticipant of thirdPartyParticipants) {
      const thirdPartyPublicKey =  await publicKeyStorageContract.getPublicKey(thirdPartyParticipant); 
      const thirdPartyJwk = JSON.parse(thirdPartyPublicKey);
      const thirdPartyEncryptedTenderKey = await encryptWithPublicKey(encryptedDocumentMetadata.keyString, thirdPartyJwk)

      tenderKeysForThirdPartyParticipants.push(
        {
          receiver: thirdPartyParticipant,
          encryptedKey: thirdPartyEncryptedTenderKey,
          iv: encryptedDocumentMetadata.iv,
          cid,
          tenderId: encryptedDocumentMetadata.encryptedTenderId,
        }
      )
    }


    const emitKeys = [
      {
        contentKey: {
          receiver: tenderOwner,
          encryptedKey: ownerEncryptedContentKey,
          iv,
          cid,
      },
      tenderKey: {
          receiver: tenderOwner,
          encryptedKey: ownerEncryptedTenderKey,
          iv: encryptedDocumentMetadata.iv,
          cid,
          tenderId: encryptedDocumentMetadata.encryptedTenderId,
        }
      }, {
        contentKey: {
          receiver: params.signer,
          encryptedKey: participantEncryptedContentKey,
          iv,
          cid,
        },
        tenderKey: {
          receiver: params.signer,
          encryptedKey: participantEncryptedTenderKey,
          iv: encryptedDocumentMetadata.iv,
          cid,
          tenderId: encryptedDocumentMetadata.encryptedTenderId,
        }
    }
    ]

    const emitKeysTx = await accessManagerContract.emitCombinedKeys(emitKeys);
    await emitKeysTx.wait();

    if (thirdPartyParticipants.length > 0) {
      const emitKeysTxForThirdPartyParticipants = await accessManagerContract.emitTenderKey(tenderKeysForThirdPartyParticipants);
      await emitKeysTxForThirdPartyParticipants.wait();
    }

    return {
      success: true,
      message: "Document uploaded and encrypted successfully",
    };
  } catch (error: any) {
    console.error("Upload document error:", error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }
}

export async function uploadInfoDocument(params: UploadInfoDocumentParams): Promise<UploadDocumentResponse> {
  try {
    const contract = await getDocumentStoreContract();

    const fileContent = await params.document.arrayBuffer();

    const ipfs = await initIPFSClient();
    
    const result = await ipfs.add({ path: params.documentName, content: fileContent });
  
    const cid = result.cid.toString();

    const uploadInput = {
      tenderId: params.tenderId,
      documentCid: cid,
      documentName: params.documentName,
      documentFormat: params.documentFormat,
      submissionDate: new Date().getDate(),
    };

    const uploadDocumentTx = await contract.uploadInfoDocument(uploadInput);
    await uploadDocumentTx.wait();

    return {
      success: true,
      message: "File uploaded successfully",
    };
  } catch (error: any) {
    console.error("Upload file error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export async function selectWinner(tenderId: string, winner: string, reason: string, particpantList: SelectWinnerParticipant[]): Promise<SelectWinnerResponse> {
  try {
    const contract = await getTenderManagerContract();
  

    // Call the smart contract
    const tx = await contract.selectWinner(
      tenderId,
      winner,
      reason,
      particpantList
    );

    // Wait for transaction to be mined
    await tx.wait();

    return {
      success: true,
      message: "Winner selected successfully"
    };
  } catch (error: any) {
    console.error("Select winner error:", error);
    throw new Error(`Failed to select winner: ${error.message}`);
  }
}

export async function grantAccess(receiver: string, cid: string, encryptedKey: string, iv: string): Promise<RequestAccessResponse> {
  try {
    const contract = await getAccessManagerContract();

    if (!receiver || !cid || !encryptedKey || !iv) {
      throw new Error("Missing required fields");
    }
  
    const emitKeyTx = await contract.emitContentKey({
      receiver: receiver,
      encryptedKey: encryptedKey,
      iv,
      cid
    });
    await emitKeyTx.wait();


    return {
      success: true,
      message: "Grant access successfully"
    };
  } catch (error: any) {
    console.error("Grant access error:", error);
    throw new Error(`Failed to grant access: ${error.message}`);
  }
}

export async function requestAccess(receiver: string, tenderId: string, cid: string, documentName: string, documentFormat: string): Promise<RequestAccessResponse> {
  try {
    const contract = await getAccessManagerContract();

    if (!receiver || !cid || !tenderId || !documentName || !documentFormat) {
      throw new Error("Missing required fields");
    }
  
    const requestAccessTx = await contract.requestAccessContent({
      receiver,
      cid,});
    await requestAccessTx.wait();
  


    return {
      success: true,
      message: "Request access successfully"
    };
  } catch (error: any) {
    console.error("Request access error:", error);
    throw new Error(`Failed to request access: ${error.message}`);
  }
}

export async function grantTenderAccess(expectedTenderId: string, receiver: string, passphrase: string, tenderOwner: string, ): Promise<RequestAccessResponse> {
  try {
    const accessManagerContract = await getAccessManagerContract();
    const tenderManagerContract = await getTenderManagerContract();

    const publicKeyStorageContract = await getPublicKeyStorageContract();
    const receiverPublicKeyInContract = await publicKeyStorageContract.getPublicKey(receiver);
    const receiverJwk = JSON.parse(receiverPublicKeyInContract);

    const response = await getTenderKey(tenderOwner);

    const tenderKeys = await decryptTenderKey(response, tenderOwner, passphrase, expectedTenderId, receiver, receiverJwk);

    const addThirdPartyParticipantTx = await tenderManagerContract.addThirdPartyParticipant(expectedTenderId, receiver);
    await addThirdPartyParticipantTx.wait();

    const grantTenderAccessTx = await accessManagerContract.emitTenderKey(tenderKeys);
    await grantTenderAccessTx.wait();

    return {
      success: true,
      message: "Tender access granted successfully"
    };
  } catch (error: any) {
    console.error("Grant tender access error:", error);
    throw new Error(`Failed to grant tender access: ${error.message}`);
  }
}

export async function addTenderMetadata(tenderId: string, metadata: TenderMetadata): Promise<any> {
  try {
    const contract = await getTenderManagerContract();

    const tx = await contract.addTenderMetadata(tenderId, metadata.name, metadata.department, metadata.projectScope, metadata.budget, metadata.qualificationRequirements, metadata.submissionGuidelines, metadata.officialCommunicationChannel);
    await tx.wait();

    return {
      success: true,
      message: "Tender metadata added successfully"
    };
  } catch (error: any) {
    console.error("Add tender metadata error:", error);
    throw new Error(`Failed to add tender metadata: ${error.message}`);
  }
}