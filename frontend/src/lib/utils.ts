import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AES, enc, lib, mode, pad } from "crypto-js";
import { toast } from "react-toastify";
import { Document } from "@/lib/types"
import { Buffer } from "buffer";
import { create } from "ipfs-http-client";
import { getAccessManagerContract } from "./contracts";
import { getDocumentByCids } from "./api_the_graph";

window.Buffer = Buffer;


const DEFAULT_IV = new Uint8Array(12); // 12-byte zero IV
const DEFAULT_SALT = new Uint8Array(16);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

export const formatDate = (timestamp: string, type: string = "int") => {
  const date = type !== 'string' 
    ? new Date(Number(timestamp) * 1000)
    : new Date(timestamp);
    
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const shortenAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}


export const calculateTimeRemaining = (endDate: string) => {
  const endTimestamp = Math.floor(new Date(Number(endDate) * 1000).getTime() / 1000)
  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = endTimestamp - now

  if (timeRemaining <= 0) return "Closed"

  const years = Math.floor(timeRemaining / (365 * 24 * 60 * 60))
  const months = Math.floor((timeRemaining % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60))
  const days = Math.floor((timeRemaining % (30 * 24 * 60 * 60)) / (24 * 60 * 60))
  const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60))

  const parts = []
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`)
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)

  return parts.join(', ') + ' remaining'
}

export async function importPrivateKeyFromJWK(jwk: any) {
  return await window.crypto.subtle.importKey(
    "jwk",         // key format
    jwk,           // the JWK object
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,          // extractable
    ["decrypt"]    // key usage
  );
}



export async function encryptPrivateKeyWithPassphrase(privateKeyString: string, passphrase: string) {
  // 1. Derive a key from the passphrase
  const encoder = new TextEncoder(); // AES-GCM needs 12-byte IV

  const passphraseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: DEFAULT_SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  

  // 2. Encrypt the stringified private key
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: DEFAULT_IV,
    },
    aesKey,
    encoder.encode(privateKeyString)
  );

  return {
    encryptedData: new Uint8Array(encrypted),
  };
}

export async function tryDecryptAndParseJSON(encryptedData: Uint8Array, passphrase: string) {
  try {
    let parsed: any;
    const decrypted = await decryptPrivateKeyWithPassphrase(encryptedData, passphrase);
  
    parsed = JSON.parse(decrypted);;

    if (!parsed.kty || !parsed.n || !parsed.e) {
      throw new Error("Decrypted content is not a valid JWK key");
    }

    return { success: true, parsed };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function decryptPrivateKeyWithPassphrase(encryptedData: Uint8Array, passphrase: string) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // 1. Re-import the passphrase and derive the AES key
  const passphraseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: DEFAULT_SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"]
  );

  // 2. Decrypt the data
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: DEFAULT_IV,
    },
    aesKey,
    new Uint8Array(encryptedData)
  );

  return decoder.decode(decryptedBuffer); // returns stringified private key (e.g., JSON)
}

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64); // decode base64 to binary string
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}



export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048, // can be 1024, 2048, or 4096
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // whether the key is extractable (i.e., can be exported)
    ["encrypt", "decrypt"] // usages
  );

  return keyPair;
}

export async function decryptData(privateKey: CryptoKey, encryptedData: any) {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedData
  );

  return new TextDecoder().decode(decrypted);
}

export const openDB = async () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('TenderApp', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('encryptedKeys')) {
        db.createObjectStore('encryptedKeys', { keyPath: 'address' });
      }
    };
  });
};

export async function getKeyFromDB(address: string): Promise<string> {
  const db = await openDB();
  const transaction = db.transaction('encryptedKeys', 'readonly');
  const store = transaction.objectStore('encryptedKeys');

  return new Promise<string>((resolve, reject) => {
    const request = store.get(address);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(result.encryptedKey);
      } else {
        resolve(""); // Address not found
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

const MIME_TYPE_MAP: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png"
};

export function getMimeType(format: string): string {
  return MIME_TYPE_MAP[format.toLowerCase()] || "application/octet-stream";
}

export async function decryptSymmetricKey(address: string, passphrase: string, encryptedKey: string) {
  const encryptedSymmetricKey = encryptedKey

  const encryptedKeyFromDB = await getKeyFromDB(address as string)

  const encKeyUint8Array = base64ToUint8Array(encryptedKeyFromDB as string);

  const decryptedResult = await tryDecryptAndParseJSON(encKeyUint8Array, passphrase);

  const privateKey = await importPrivateKeyFromJWK(decryptedResult.parsed);
  
  const symmetricKey = await decryptData(privateKey, base64ToUint8Array(encryptedSymmetricKey));

  return symmetricKey;
}


export async function downloadEncryptedFile(address: string, doc: Document, passphrase: string) {
  try {
    let encryptedKey = "";
    let iv = "";


    const contract = await getAccessManagerContract();

    const docs = await contract.getEncryptedContentKey(doc.documentCid, address);

    encryptedKey = docs[0]
    iv = docs[1]

   const symmetricKey = await decryptSymmetricKey(address, passphrase, encryptedKey)

    const ipfsUrl = `${import.meta.env.VITE_IPFS_GATEWAY_URL}/ipfs/${doc.documentCid}`;
    const response = await fetch(ipfsUrl);
    if (!response.ok) throw new Error("Failed to fetch file from IPFS");

    const encryptedArrayBuffer = await response.arrayBuffer();
    const encryptedWordArray = enc.Hex.parse(Buffer.from(encryptedArrayBuffer).toString("hex"));

    const key = enc.Hex.parse(symmetricKey);
    const ivBuf = enc.Hex.parse(iv);

    const cipherParams = lib.CipherParams.create({
      ciphertext: encryptedWordArray
    });

    const decrypted = AES.decrypt(cipherParams, key, {
      iv: ivBuf,
      mode: mode.CBC,
      padding: pad.Pkcs7
    });

    const decryptedHex = decrypted.toString(enc.Hex);
    const decryptedBytes = Buffer.from(decryptedHex, "hex");

    let blob;

    if (doc.documentFormat) {
      blob = new Blob([decryptedBytes], { type: getMimeType(doc.documentFormat) });
    } else {
      blob = new Blob([decryptedBytes], { type: "application/octet-stream" });
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Failed to decrypt and open document.");
    return false
  }
}

export async function downloadFile(doc: Document) {
  try {
    const ipfsUrl = `${import.meta.env.VITE_IPFS_GATEWAY_URL}/ipfs/${doc.documentCid}`;
    const response = await fetch(ipfsUrl);
    if (!response.ok) throw new Error("Failed to fetch file from IPFS");

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: getMimeType(doc.documentFormat) });
    const url = URL.createObjectURL(blob);
    
    window.open(url, "_blank");
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Failed to download document.");
  }
}

export async function encryptWithPublicKey(stringToEncrypt: string, publicKeyJwk: any) {
  // Import the public key from JWK format
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  // Encrypt the symmetric key with the public key
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    new TextEncoder().encode(stringToEncrypt)
  );

  // Convert to base64 for storage/transmission
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function encryptWithSymmetricKey(
  data: string,
  symmetricKey: string,
  iv: string
): Promise<string> {
  // Convert hex string key to Uint8Array
  const keyArray = new Uint8Array(Buffer.from(symmetricKey, 'hex'));

  // Import the symmetric key
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyArray,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  // Convert string data to Uint8Array
  const dataArray = new TextEncoder().encode(data);

  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv: Buffer.from(iv, 'hex') },
    cryptoKey,
    dataArray
  );

  return Buffer.from(new Uint8Array(encryptedBuffer)).toString('hex');
}


export function showPassphraseDialog(): Promise<string | null> {
  return new Promise((resolve) => {
    // Check if passphrase is already stored in localStorage
    const storedPassphrase = localStorage.getItem('tender_app_passphrase');
    if (storedPassphrase) {
      resolve(storedPassphrase);
      return;
    }

    // Create a simple dialog using browser's built-in prompt
    const passphrase = prompt("Enter your private key passphrase:")
    if (passphrase === null) {
      resolve(null) // User cancelled
    } else {
      const trimmedPassphrase = passphrase.trim() || null;
      if (trimmedPassphrase) {
        const storeUntilLogout = confirm("Do you want to store this passphrase until logout? (You won't need to enter it again for this session)");
        if (storeUntilLogout) {
          localStorage.setItem('tender_app_passphrase', trimmedPassphrase);
        }
      }
      resolve(trimmedPassphrase);
    }
  })
}

export async function downloadEncryptedFileWithDialog(address: string, doc: Document) {
  const passphrase = await showPassphraseDialog()
  if (passphrase) {
    console.log(doc)
    const success = await downloadEncryptedFile(address, doc, passphrase)
    if (!success) {
      return false;
    }
    return true
  }
}

export function clearStoredPassphrase() {
  localStorage.removeItem('tender_app_passphrase');
}

export const initIPFSClient = async () => {
  // Connect to the IPFS API
  const ipfs = create({
    host: import.meta.env.VITE_IPFS_HOST || 'localhost',
    port: Number(import.meta.env.VITE_IPFS_PORT) || 5051,
    protocol: import.meta.env.VITE_IPFS_PROTOCOL || 'http'
  });
  return ipfs;
};


async function generateSymmetricKey() {
  return window.crypto.getRandomValues(new Uint8Array(32)); // AES-256 = 32 bytes
}

async function encryptFile(arrayBuffer: ArrayBuffer, key: any) {
  const iv = window.crypto.getRandomValues(new Uint8Array(16)); // AES block size
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    arrayBuffer
  );

  return {
    encryptedBuffer: new Uint8Array(encryptedBuffer),
    key: Buffer.from(key).toString('hex'),
    iv: Buffer.from(iv).toString('hex')
  };
}

export async function uploadToIPFSClientEncrypted(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const symmetricKey = await generateSymmetricKey();
  const { encryptedBuffer, key, iv } = await encryptFile(arrayBuffer, symmetricKey);

  const ipfs = await initIPFSClient();

  const fileToUpload = {
    path: file.name,
    content: encryptedBuffer
  };

  const result = await ipfs.add(fileToUpload);

  return {
    cid: result.cid.toString(),
    key,
    iv
  };
}

export async function encryptDocumentMetadata(tenderId: string, documentName: string, documentType: string, documentFormat: string, participantName: string, participantEmail: string) {
  const symmetricKey = await generateSymmetricKey();
  const keyString = Buffer.from(symmetricKey).toString('hex');
  const iv = Buffer.from(window.crypto.getRandomValues(new Uint8Array(16))).toString('hex');
  
  const encryptedDocumentName = await encryptWithSymmetricKey(documentName, keyString, iv);
  const encryptedDocumentFormat = await encryptWithSymmetricKey(documentFormat, keyString, iv);
  const encryptedDocumentType = await encryptWithSymmetricKey(documentType, keyString, iv);
  const encryptedParticipantName = await encryptWithSymmetricKey(participantName, keyString, iv);
  const encryptedParticipantEmail = await encryptWithSymmetricKey(participantEmail, keyString, iv);
  const encryptedTenderId = await encryptWithSymmetricKey(tenderId, keyString, iv);

  return {
    encryptedDocumentName,
    encryptedDocumentFormat,
    encryptedDocumentType,
    encryptedParticipantName,
    encryptedParticipantEmail,
    encryptedTenderId,
    keyString,
    iv,
  }
}

export async function decryptDocumentMetadata(tenderId: string, documentName: string, documentFormat: string, participantName: string, participantEmail: string, symmetricKey: string, iv: string) {  
  const decryptedDocumentName = await decryptWithSymmetricKey(documentName, symmetricKey, iv);
  const decryptedDocumentFormat = await decryptWithSymmetricKey(documentFormat, symmetricKey, iv);
  const decryptedParticipantName = await decryptWithSymmetricKey(participantName, symmetricKey, iv);
  const decryptedParticipantEmail = await decryptWithSymmetricKey(participantEmail, symmetricKey, iv);
  const decryptedTenderId = await decryptWithSymmetricKey(tenderId, symmetricKey, iv);

  return {
    decryptedDocumentName,
    decryptedDocumentFormat,
    decryptedParticipantName,
    decryptedParticipantEmail,
    decryptedTenderId
  }
}

export async function decryptWithSymmetricKey(
  encryptedData: string,
  symmetricKey: string,
  iv: string
): Promise<string> {
  // Convert hex strings to Uint8Array
  const keyArray = new Uint8Array(Buffer.from(symmetricKey, 'hex'));
  const ivArray = new Uint8Array(Buffer.from(iv, 'hex'));
  
  // Import the symmetric key
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyArray,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  // Decrypt the data
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivArray },
    cryptoKey,
    Buffer.from(encryptedData, 'hex')
  );

  // Convert decrypted ArrayBuffer to string
  return new TextDecoder().decode(decryptedBuffer);
}


export function generateTenderId(): string {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36
  const random = Math.random().toString(36).substring(2, 8); // Random 6 chars
  return `${timestamp}-${random}`; // Format: timestamp-random
}

export async function decryptDocuments(response: any, tenderOwner: string, passphrase: string, expectedTenderId: string) {
    const cidsOfTender = []
    const mapTenderKeyToCid: { [key: string]: string } = {}
    const mapIvToCid: { [key: string]: string } = {}
    if (response && response.length > 0) {
      for (const res of response) {
        const symmetricKey = await decryptSymmetricKey(tenderOwner as string, passphrase, res.encryptedKey)
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
    return decryptedDocuments;
}

export async function decryptTenderKey(response: any, tenderOwner: string, passphrase: string, expectedTenderId: string, receiver: string, receiverJwk: any) {
  let tenderKeys: any[] = []
  if (response && response.length > 0) {
    for (const res of response) {
      const symmetricKey = await decryptSymmetricKey(tenderOwner as string, passphrase, res.encryptedKey)
      const tenderId = await decryptWithSymmetricKey(res.tenderId, symmetricKey, res.iv)
      const receiverEncryptedSymmetricKey = await encryptWithPublicKey(symmetricKey, receiverJwk)
      if (tenderId === expectedTenderId) {
          tenderKeys.push({
            receiver: receiver,
            encryptedKey: receiverEncryptedSymmetricKey,
            iv: res.iv,
            cid: res.cid,
            tenderId: res.tenderId
          })
      }
    }
  }
  return tenderKeys
}