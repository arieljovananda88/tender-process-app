import { ethers } from 'ethers';
import axios from 'axios';
import { encryptSymmetricKeyWithPublicKey, initIPFSClient, uploadToIPFSClientEncrypted } from './utils';
// const API_BASE_URL = `http://localhost:${import.meta.env.VITE_BACKEND_PORT}`;

export interface Tender {
  tenderId: string;
  owner: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface TenderResponse {
  success: boolean;
  tender: Tender;
}

export interface ParticipantResponse {
  participant: string;
  name: string;
  email: string;
}

export interface UserResponse {
  name: string;
  email: string;
}

export interface RequestAccessResponse {
  success: boolean;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  tenders: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface RegisterResponse {
  success: boolean;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
}

export interface NonceResponse {
  message: string;
}

export interface IsRegisteredResponse {
  isRegistered: boolean;
}

export interface AddParticipantResponse {
  success: boolean;
  message: string;
}

export interface CreateTenderResponse {
  success: boolean;
  message: string;
  tenderId: string;
}

export interface KeyResponse {
  encryptedKey: string;
  iv: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  documentCid?: string;
}

export interface SelectWinnerResponse {
  success: boolean;
  message: string;
}

export interface UploadDocumentParams {
  document: File;
  documentName: string;
  documentType: string;
  documentFormat: string;
  tenderId: string;
  participantName: string;
  participantEmail: string;
  deadline: number;
  v: number;
  r: string;
  s: string;
  signer: string;
}

export interface UploadInfoDocumentParams {
  document: File;
  documentName: string;
  documentFormat: string;
  tenderId: string;
  deadline: number;
  v: number;
  r: string;
  s: string;
  signer: string;
}

export interface AccessRequest {
  id: string;
  requester: string;
  receiver: string;
  cid: string;
  documentName: string;
  documentFormat: string;
  tenderId: string;
  blockTimestamp: string;
}

export async function getTenders(search: string = "", page: number = 0, pageSize: number = 10): Promise<Tender[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createTenderQuery(search, page, pageSize),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.tenderCreateds;
}

export async function getTendersLength(search: string = ""): Promise<number> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createTenderLengthQuery(search),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.tenderCreateds.length;
}

export async function getRegisteredTenders(participant: string, search: string = "", page: number = 0, pageSize: number = 10): Promise<Tender[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createRegisteredTenderQuery(participant, search, page, pageSize),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.joinedTenders;
}

export async function getRegisteredTendersLength(participant: string, search: string = ""): Promise<number> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createRegisteredTenderLengthQuery(participant, search),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.joinedTenders.length;
}

export async function getMyTenders(address: string, search: string = "", page: number = 0, pageSize: number = 10): Promise<Tender[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createMyTenderQuery(address, search, page, pageSize),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.tenderCreateds;
}

export async function getMyTendersLength(address: string, search: string = ""): Promise<number> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createMyTenderLengthQuery(address, search),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.tenderCreateds.length;
}

export async function getKey(address: string, cid: string): Promise<KeyResponse> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API,
    {
      query: createKeyQuery(address, cid),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.emitKeys[0];
}

// Helper function to generate a shorter unique ID
function generateTenderId(): string {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36
    const random = Math.random().toString(36).substring(2, 8); // Random 6 chars
    return `${timestamp}-${random}`; // Format: timestamp-random
}

export async function createTender( 
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  deadline: number,
  v: number,
  r: string,
  s: string,
  ): Promise<CreateTenderResponse> {
  try {
    
    // Get provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Get contract instance
    const tenderManagerAddress = import.meta.env.VITE_TENDER_MANAGER_CONTRACT_ADDRESS;
    const TenderManagerArtifact = await import('../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json');
    const contract = new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signer);

    // Generate tenderId using timestamp and random number
    const tenderId = generateTenderId();

    // Convert dates to Unix timestamp
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

    // Call the smart contract
    const tx = await contract.createTender(
      tenderId,
      name,
      description,
      startTimestamp,
      endTimestamp,
      v,
      r,
      s,
      deadline
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

  export async function getTenderById(id: string): Promise<Tender> {
    // console.log("spam")
    const response = await axios.post(
      import.meta.env.VITE_THE_GRAPH_TENDER_API,
      {
        query: createTenderByIDQuery(id),
        operationName: 'Subgraphs',
        variables: {}
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
        }
      }
    )
    return response.data.data.tenderCreateds[0];
    
  }

export async function getPendingParticipants(id: string): Promise<ParticipantResponse[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createPendingParticipantQuery(id),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.pendingParticipantAddeds;
}

export async function getParticipants(id: string): Promise<ParticipantResponse[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createParticipantQuery(id),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.participantAddeds;
}

export async function getUser(address: string): Promise<UserResponse> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_PUBLIC_KEY_API,
    {
      query: createUserQuery(address),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.publicKeyStoreds[0];
}

export async function registerUser(name: string, email: string, address: string, publicKey: string): Promise<RegisterResponse> {
  try {
    if (!email || !address || !name || !publicKey) {
        throw new Error("Missing email, address or name");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const publicKeyStorageAddress = import.meta.env.VITE_PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
    const PublicKeyStorageArtifact = await import('../../../backend/artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json');
    const contract = new ethers.Contract(publicKeyStorageAddress, PublicKeyStorageArtifact.abi, signer);

    const publicKeyInContract = await contract.getPublicKey(address);
    if (publicKeyInContract) {
        throw new Error("Public key has already been registered");
    }

    await contract.storeUserInfo(address, email, name, publicKey);

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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const publicKeyStorageAddress = import.meta.env.VITE_PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
    const PublicKeyStorageArtifact = await import('../../../backend/artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json');
    const contract = new ethers.Contract(publicKeyStorageAddress, PublicKeyStorageArtifact.abi, signer);

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
  deadline: number,
  v: number,
  r: string,
  s: string,
): Promise<AddParticipantResponse> {
  try {
    
    // Get provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signerInstance = provider.getSigner();
    
    // Get contract instance
    const tenderManagerAddress = import.meta.env.VITE_TENDER_MANAGER_CONTRACT_ADDRESS;
    const TenderManagerArtifact = await import('../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json');
    const contract = new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signerInstance);

    // Call the smart contract
    const tx = await contract.addParticipant(
      tenderId,
      participant,
      participantName,
      participantEmail,
      v,
      r,
      s,
      deadline
    );

    // Wait for transaction to be mined
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
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  if (!params.tenderId || !params.documentName || !params.documentType || !params.participantName || !params.participantEmail || !params.deadline || !params.v || !params.r || !params.s || !params.signer || !params.documentFormat) {
    throw new Error("Missing required fields");
  }

  try {
    // Upload and encrypt file to IPFS
    const { cid, key, iv } = await uploadToIPFSClientEncrypted(params.document);

    // Upload document with signature to smart contract
    const documentStoreAddress = import.meta.env.VITE_DOCUMENT_STORE_CONTRACT_ADDRESS;
    const DocumentStoreArtifact = await import('../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json');
    const documentContract = new ethers.Contract(documentStoreAddress, DocumentStoreArtifact.abi, signer);

    const uploadInput = {
      tenderId: params.tenderId,
      documentCid: cid,
      documentName: params.documentName,
      documentType: params.documentType,
      documentFormat: params.documentFormat,
      participantName: params.participantName,
      participantEmail: params.participantEmail,
      deadline: params.deadline,
      v: params.v,
      r: params.r,
      s: params.s
    };
    const uploadDocumentTx = await documentContract.uploadDocumentWithSignature(uploadInput);
    await uploadDocumentTx.wait();

    // Get tender owner and emit keys
    const tenderManagerAddress = import.meta.env.VITE_TENDER_MANAGER_CONTRACT_ADDRESS;
    const TenderManagerArtifact = await import('../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json');
    const tenderManagerContract = new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signer);
    const owner = await tenderManagerContract.getOwner(params.tenderId);

    const publicKeyStorageAddress = import.meta.env.VITE_PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
    const PublicKeyStorageArtifact = await import('../../../backend/artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json');
    const publicKeyStorageContract = new ethers.Contract(publicKeyStorageAddress, PublicKeyStorageArtifact.abi, signer);

    const ownerPublicKeyInContract = await publicKeyStorageContract.getPublicKey(owner);
    const participantPublicKeyInContract = await publicKeyStorageContract.getPublicKey(params.signer);

    const ownerJwk = JSON.parse(ownerPublicKeyInContract);
    const participantJwk = JSON.parse(participantPublicKeyInContract);


    const ownerEncryptedSymmetricKey = await encryptSymmetricKeyWithPublicKey(key, ownerJwk)

    const participantEncryptedSymmetricKey = await encryptSymmetricKeyWithPublicKey(key, participantJwk)


    const keyManagerAddress = import.meta.env.VITE_KEY_MANAGER_CONTRACT_ADDRESS;
    const KeyManagerArtifact = await import('../../../backend/artifacts/contracts/KeyManager.sol/KeyManager.json');
    const keyManagerContract = new ethers.Contract(keyManagerAddress, KeyManagerArtifact.abi, signer);

    const emitKeyOwnerTx = await keyManagerContract.emitKey({
      receiver: owner,
      encryptedKey: ownerEncryptedSymmetricKey,
      iv,
      cid,
      tenderId: params.tenderId,
      documentName: params.documentName,
      v: params.v,
      r: params.r,
      s: params.s,
      deadline: params.deadline
    });
    await emitKeyOwnerTx.wait();

    const emitKeySignerTx = await keyManagerContract.emitKey({
      receiver: params.signer,
      encryptedKey: participantEncryptedSymmetricKey,
      iv,
      cid,
      tenderId: params.tenderId,
      documentName: params.documentName,
      v: params.v,
      r: params.r,
      s: params.s,
      deadline: params.deadline
    });
    await emitKeySignerTx.wait();

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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const documentStoreAddress = import.meta.env.VITE_DOCUMENT_STORE_CONTRACT_ADDRESS;
    const DocumentStoreArtifact = await import('../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json');
    const contract = new ethers.Contract(documentStoreAddress, DocumentStoreArtifact.abi, signer);

    const fileContent = await params.document.arrayBuffer();

    const ipfs = await initIPFSClient();
    
    const result = await ipfs.add({ path: params.documentName, content: fileContent });
    
    
    const cid = result.cid.toString();

    const uploadInput = {
      tenderId: params.tenderId,
      documentCid: cid,
      documentName: params.documentName,
      documentType: "",
      documentFormat: params.documentFormat,
      participantName: "",
      participantEmail: "",
      deadline: params.deadline,
      v: params.v,
      r: params.r,
      s: params.s
    };

    const uploadDocumentTx = await contract.uploadTenderInfoDocumentWithSignature(uploadInput);
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

export async function selectWinner(tenderId: string, winner: string, reason: string, deadline: number, v: number, r: string, s: string): Promise<SelectWinnerResponse> {
  try {
    // Get provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Get contract instance
    const tenderManagerAddress = import.meta.env.VITE_TENDER_MANAGER_CONTRACT_ADDRESS;
    const TenderManagerArtifact = await import('../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json');
    const contract = new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signer);

    // Call the smart contract
    const tx = await contract.selectWinner(
      tenderId,
      winner,
      reason,
      v,
      r,
      s,
      deadline
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

export async function grantAccess(receiver: string, tenderId: string, cid: string, documentName: string, encryptedKey: string, iv: string, deadline: number, v: number, r: string, s: string): Promise<RequestAccessResponse> {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const keyManagerAddress = import.meta.env.VITE_KEY_MANAGER_CONTRACT_ADDRESS;
    const KeyManagerArtifact = await import('../../../backend/artifacts/contracts/KeyManager.sol/KeyManager.json');
    const contract = new ethers.Contract(keyManagerAddress, KeyManagerArtifact.abi, signer);
    if (!receiver || !cid || !tenderId || !documentName || !encryptedKey || !iv || !v || !r || !s || !deadline) {
      throw new Error("Missing required fields");
    }
  
    const emitKeyTx = await contract.emitKey({
      receiver: receiver,
      encryptedKey: encryptedKey,
      iv,
      cid,
      tenderId,
      documentName,
      v,
      r,
      s, deadline});
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

export async function requestAccess(receiver: string, tenderId: string, cid: string, documentName: string, documentFormat: string, deadline: number, v: number, r: string, s: string): Promise<RequestAccessResponse> {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const keyManagerAddress = import.meta.env.VITE_KEY_MANAGER_CONTRACT_ADDRESS;
    const KeyManagerArtifact = await import('../../../backend/artifacts/contracts/KeyManager.sol/KeyManager.json');
    const contract = new ethers.Contract(keyManagerAddress, KeyManagerArtifact.abi, signer);

    if (!receiver || !cid || !tenderId || !documentName || !documentFormat || !v || !r || !s || !deadline) {
      throw new Error("Missing required fields");
    }
  
    const requestAccessTx = await contract.requestAccess({
      receiver,
      tenderId,
      cid,
      documentName,
      documentFormat,
      v,
      r, s, deadline});
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

export async function getAccessRequests(search: string = "", page: number = 0, pageSize: number = 10, requester: string = ""): Promise<AccessRequest[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API,
    {
      query: createAccessRequestsQuery(search, page, pageSize, requester),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.requestAccesses;
}

export async function getAccessRequestsLength(search: string = "", requester: string = ""): Promise<number> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API,
    {
      query: createAccessRequestsLengthQuery(search, requester),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_API_KEY}`
      }
    }
  )
  return response.data.data.requestAccesses.length;
}

export async function getAccessRequestsToMe(search: string = "", page: number = 0, pageSize: number = 10, receiver: string = ""): Promise<AccessRequest[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API,
    {
      query: createAccessRequestsToMeQuery(search, page, pageSize, receiver),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API}`
      }
    }
  )
  return response.data.data.requestAccesses;
}

export async function getAccessRequestsToMeLength(search: string = "", receiver: string = ""): Promise<number> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API,
    {
      query: createAccessRequestsToMeLengthQuery(search, receiver),
      operationName: 'Subgraphs',
      variables: {}
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_THE_GRAPH_KEY_MANAGER_API}`
      }
    }
  )
  return response.data.data.requestAccesses.length;
}

const createTenderQuery = (search: string = "", page: number = 0, pageSize: number = 10) => {
  let condition = ""
  if (search) {
    condition = `where: {name_contains: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      tenderCreateds(${pagination}, ${condition}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

const createTenderLengthQuery = (search: string = "") => {
  let condition = ""
  if (search) {
    condition = `(where: { name_contains: "${search}" })`
  }

  return `
    query Subgraphs {
      tenderCreateds${condition} {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `;
};


const createMyTenderQuery = (address: string, search: string = "", page: number = 0, pageSize: number = 10) => {
  let condition = ""
  if (address) {
    condition = `where: {owner: "${address}" }`
  }
  if (search) {
    condition = `where: {owner: "${address}", name_contains: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      tenderCreateds(${pagination}, ${condition}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

const createMyTenderLengthQuery = (address: string, search: string = "") => {
  let condition = ""
  if (address) {
    condition = `where: {owner: "${address}" }`
  }
  if (search) {
    condition = `where: {owner: "${address}", name_contains: "${search}" }`
  }
  return `
    query Subgraphs {
      tenderCreateds(${condition}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

const createTenderByIDQuery = (id: string) => {
  return `
    query Subgraphs {
      tenderCreateds(where: {tenderId: "${id}"}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}
const createPendingParticipantQuery = (id: string) => {
  return `
  query Subgraphs {
    pendingParticipantAddeds(
      where: { tenderId: "${id}" }
    ) {
      participant
      name
    }
  }
`;
}

const createParticipantQuery = (id: string) => {
  return `
  query Subgraphs {
    participantAddeds(
      where: { tenderId: "${id}" }
    ) {
      participant
      name
    }
  }
`;
}

const createUserQuery = (address: string) => {
  return `
    query Subgraphs {
      publicKeyStoreds(where: {walletAddress: "${address}"}) {
        email
        name
      }
    }
  `
}

const createKeyQuery = (address: string, cid: string) => {
  return `
    query Subgraphs {
      emitKeys(where: {receiver: "${address}", cid: "${cid}"}) {
        encryptedKey
        iv
      }
    }
  `
}

const createAccessRequestsQuery = (search: string = "", page: number = 0, pageSize: number = 10, requester: string = "") => {
  let condition = ""
  if (requester) {
    condition = `where: {requester: "${requester}" }`
  }
  if (search) {
    condition = `where: {requester: "${requester}", documentName_contains: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      requestAccesses(${pagination}, ${condition}) {
        id
        requester
        receiver
        cid
        documentName
        documentFormat
        tenderId
        blockTimestamp
      }
    }
  `
}

const createAccessRequestsLengthQuery = (search: string = "", requester: string = "") => {
  let condition = ""
  if (requester) {
    condition = `where: {requester: "${requester}" }`
  }
  if (search) {
    condition = `where: {requester: "${requester}", documentName_contains: "${search}" }`
  }

  return `
    query Subgraphs {
      requestAccesses(${condition}) {
        id
        requester
        receiver
        cid
        documentName
        documentFormat
        tenderId
        blockTimestamp
      }
    }
  `;
};

const createAccessRequestsToMeQuery = (search: string = "", page: number = 0, pageSize: number = 10, receiver: string = "") => {
  let condition = ""
  if (receiver) {
    condition = `where: {receiver: "${receiver}" }`
  }
  if (search) {
    condition = `where: {receiver: "${receiver}", documentName_contains: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      requestAccesses(${pagination}, ${condition}) {
        id
        requester
        receiver
        cid
        documentName
        documentFormat
        tenderId
        blockTimestamp
      }
    }
  `
}

const createAccessRequestsToMeLengthQuery = (search: string = "", receiver: string = "") => {
  let condition = ""
  if (receiver) {
    condition = `where: {receiver: "${receiver}" }`
  }
  if (search) {
    condition = `where: {receiver: "${receiver}", documentName_contains: "${search}" }`
  }

  return `
    query Subgraphs {
      requestAccesses(${condition}) {
        id
        requester
        receiver
        cid
        documentName
        documentFormat
        tenderId
        blockTimestamp
      }
    }
  `;
};

const createRegisteredTenderQuery = (address: string, search: string = "", page: number = 0, pageSize: number = 10) => {
  let condition = ""
  if (address) {
    condition = `where: {participant: "${address}" }`
  }
  if (search) {
    condition = `where: {participant: "${address}", name_contains: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      joinedTenders(${pagination}, ${condition}) {
        id
        participant
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

const createRegisteredTenderLengthQuery = (address: string, search: string = "") => {
  let condition = ""
  if (address) {
    condition = `where: {owner: "${address}" }`
  }
  if (search) {
    condition = `where: {owner: "${address}", name_contains: "${search}" }`
  }
  return `
    query Subgraphs {
      joinedTenders(${condition}) {
        id
      }
    }
  `
}