import { encryptWithPublicKey, initIPFSClient, uploadToIPFSClientEncrypted, generateTenderId, encryptDocumentMetadata } from './utils';
import { getPublicKeyStorageContract, getTenderManagerContract, getAccessManagerContract, getDocumentStoreContract } from './contracts';
import { CreateTenderResponse, AddParticipantResponse, UploadDocumentResponse, SelectWinnerResponse, RequestAccessResponse, RegisterResponse, UploadInfoDocumentParams, UploadDocumentParams } from './types';

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

export async function addParticipant(
  tenderId: string,
  participant: string,
  participantName: string,
  participantEmail: string,
): Promise<AddParticipantResponse> {
  try {
    const contract = await getTenderManagerContract();

    const tx = await contract.addParticipant(
      tenderId,
      participant,
      participantName,
      participantEmail,
    );

    await tx.wait();

    return {
      success: true,
      message: "Participant added successfully"
    };
  } catch (error: any) {
    console.error("Add participant error:", error);
    throw new Error(`Failed to add participant: ${error.message}`);
  }
}

export async function uploadDocument(params: UploadDocumentParams): Promise<UploadDocumentResponse> {
  if (!params.tenderId || !params.documentName || !params.documentType || !params.participantName || !params.participantEmail || !params.documentFormat) {
    throw new Error("Missing required fields");
  }

  try {
    const tenderManagerContract = await getTenderManagerContract();
    const tenderOwner = await tenderManagerContract.getOwner(params.tenderId);

    // Upload and encrypt file to IPFS
    const { cid, key, iv } = await uploadToIPFSClientEncrypted(params.document);

    // Upload document with signature to smart contract
    const documentContract = await getDocumentStoreContract();
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

    const publicKeyStorageContract = await getPublicKeyStorageContract();

    const ownerPublicKeyInContract = await publicKeyStorageContract.getPublicKey(tenderOwner);
    const participantPublicKeyInContract = await publicKeyStorageContract.getPublicKey(params.signer);

    const ownerJwk = JSON.parse(ownerPublicKeyInContract);
    const participantJwk = JSON.parse(participantPublicKeyInContract);


    const ownerEncryptedContentKey = await encryptWithPublicKey(key, ownerJwk)

    const ownerEncryptedTenderKey = await encryptWithPublicKey(encryptedDocumentMetadata.keyString, ownerJwk)

    const participantEncryptedContentKey = await encryptWithPublicKey(key, participantJwk)

    const participantEncryptedTenderKey = await encryptWithPublicKey(encryptedDocumentMetadata.keyString, participantJwk)


    const keyManagerContract = await getAccessManagerContract();

    const emitKeyOwnerTx = await keyManagerContract.emitCombinedKeys(
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
      }
    );

    await emitKeyOwnerTx.wait();

    const emitKeySignerTx = await keyManagerContract.emitCombinedKeys(
    {
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
  });
    await emitKeySignerTx.wait();;

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

export async function selectWinner(tenderId: string, winner: string, reason: string): Promise<SelectWinnerResponse> {
  try {
    const contract = await getTenderManagerContract();

    // Call the smart contract
    const tx = await contract.selectWinner(
      tenderId,
      winner,
      reason,
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

export async function grantAccess(receiver: string, tenderId: string, cid: string, documentName: string, encryptedKey: string, iv: string): Promise<RequestAccessResponse> {
  try {
    const contract = await getAccessManagerContract();

    if (!receiver || !cid || !tenderId || !documentName || !encryptedKey || !iv) {
      throw new Error("Missing required fields");
    }
  
    const emitKeyTx = await contract.emitContentKey({
      receiver: receiver,
      encryptedKey: encryptedKey,
      iv,
      cid,
      tenderId,
      documentName});
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
      tenderId,
      cid,
      documentName,
      documentFormat});
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