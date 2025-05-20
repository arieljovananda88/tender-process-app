import axios from 'axios';

const API_BASE_URL = `http://localhost:${import.meta.env.VITE_BACKEND_PORT}`;

export interface Tender {
  tenderId: string;
  owner: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  winner: string;
  isActive: boolean;
}

export interface TenderResponse {
  success: boolean;
  tender: Tender;
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

export async function getAllTenders(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Tender>> {
  const response = await axios.get(`${API_BASE_URL}/tender`, {
    params: {
      page,
      pageSize
    }
  });
  return response.data;
}

export async function getTenderById(id: string): Promise<TenderResponse> {
  const response = await axios.get(`${API_BASE_URL}/tender/${id}`);
  return response.data;
}

export async function registerUser(name: string, email: string, address: string, publicKey: string): Promise<RegisterResponse> {
  const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, {
    name,
    email,
    address,
    publicKey
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
  deadline: number,
  v: number,
  r: string,
  s: string,
  signer: string
): Promise<AddParticipantResponse> {
  const response = await axios.post<AddParticipantResponse>(`${API_BASE_URL}/tender/${tenderId}/participants`, {
    participant,
    deadline,
    v,
    r,
    s,
    signer
  });
  return response.data;
}
