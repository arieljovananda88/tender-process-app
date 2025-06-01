import axios from 'axios';
import { createMyTenderQuery, createParticipantQuery, createPendingParticipantQuery, createTenderByIDQuery, createTenderQuery, createUserQuery } from './utils';
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

export async function getAllTenders(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Tender>> {
  const response = await axios.get(`${API_BASE_URL}/tender`, {
    params: {
      page,
      pageSize
    }
  });
  return response.data;
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

export async function getPendingParticipants(id: string, page: number = 0): Promise<ParticipantResponse[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createPendingParticipantQuery(id, page),
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

export async function getParticipants(id: string, page: number = 0): Promise<ParticipantResponse[]> {
  const response = await axios.post(
    import.meta.env.VITE_THE_GRAPH_TENDER_API,
    {
      query: createParticipantQuery(id, page),
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

export async function registerUser(name: string, email: string, address: string): Promise<RegisterResponse> {
  const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, {
    name,
    email,
    address,
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
