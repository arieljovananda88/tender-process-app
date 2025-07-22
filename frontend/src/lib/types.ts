export type Document = {
    documentCid: string;
    documentName: string;
    documentFormat: string;
    submissionDate: string;
  };

  export interface Participant {
    address: string
    name: string
    email: string
  }

  export interface SelectWinnerParticipant {
    participantAddress: string
    name: string
  }

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
    role: string
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
    signer: string;
  }
  
  export interface UploadInfoDocumentParams {
    document: File;
    documentName: string;
    documentFormat: string;
    tenderId: string;
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

  export interface InfoDocument {
    tenderId: string;
    documentCid: string;
    documentName: string;
    documentFormat: string;
  }