import axios from 'axios';
const API_BASE_URL = `http://localhost:${import.meta.env.VITE_BACKEND_PORT}`;

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

export async function getAllTenders(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Tender>> {
  const response = await axios.get(`${API_BASE_URL}/tender`, {
    params: {
      page,
      pageSize
    }
  });
  return response.data;
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
  const response = await axios.post<CreateTenderResponse>(`${API_BASE_URL}/tender`, {
    name: name,
    description: description,
    startDate: startDate,
    endDate: endDate,
    deadline: deadline,
    v: v,
    r: r,
    s: s,
  });
  return response.data;
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
  const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, {
    name,
    email,
    address,
    publicKey,
  });
  return response.data;
}

export async function checkIsRegistered(address: string): Promise<boolean> {
  const res = await axios.get<IsRegisteredResponse>(`${API_BASE_URL}/auth/is-registered?address=${address}`);
  return res.data.isRegistered;
}

export async function getNonce(address: string): Promise<string> {
  const res = await axios.get<NonceResponse>(`${API_BASE_URL}/auth/nonce?address=${address}`);
  return res.data.message;
}

export async function verifySignature(address: string, signature: string): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/verify`, { address, signature });
  return res.data;
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
  signer: string
): Promise<AddParticipantResponse> {
  const response = await axios.post<AddParticipantResponse>(`${API_BASE_URL}/tender/${tenderId}/participants`, {
    participant,
    deadline,
    participantName,
    participantEmail,
    v,
    r,
    s,
    signer
  });
  return response.data;
}

export async function uploadDocument(params: UploadDocumentParams): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("document", params.document);
  formData.append("documentName", params.documentName);
  formData.append("documentType", params.documentType);
  formData.append("documentFormat", params.documentFormat);
  formData.append("participantName", params.participantName);
  formData.append("participantEmail", params.participantEmail);
  formData.append("tenderId", params.tenderId);
  formData.append("deadline", params.deadline.toString());
  formData.append("v", params.v.toString());
  formData.append("r", params.r);
  formData.append("s", params.s);
  formData.append("signer", params.signer);

  const response = await axios.post<UploadDocumentResponse>(
    `${API_BASE_URL}/upload-document`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function uploadInfoDocument(params: UploadInfoDocumentParams): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("document", params.document);
  formData.append("documentName", params.documentName);
  formData.append("documentFormat", params.documentFormat);
  formData.append("tenderId", params.tenderId);
  formData.append("deadline", params.deadline.toString());
  formData.append("v", params.v.toString());
  formData.append("r", params.r);
  formData.append("s", params.s);
  formData.append("signer", params.signer);

  const response = await axios.post<UploadDocumentResponse>(
    `${API_BASE_URL}/upload-document/info`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
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
