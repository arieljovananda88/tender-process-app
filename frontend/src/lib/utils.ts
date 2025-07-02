import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AES, enc, lib, mode, pad } from "crypto-js";
import { getKey } from "./api";
import { toast } from "react-toastify";
import { Document } from "@/lib/types"
import { Buffer } from "buffer";

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
    let {encryptedKey, iv} = await getKey(address as string, doc.documentCid)

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

    const blob = new Blob([decryptedBytes], { type: getMimeType(doc.documentFormat) });
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

export async function encryptSymmetricKeyWithPublicKey(symmetricKey: string, publicKeyJwk: any) {
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
    new TextEncoder().encode(symmetricKey)
  );

  // Convert to base64 for storage/transmission
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export function showPassphraseDialog(): Promise<string | null> {
  return new Promise((resolve) => {
    // Create a simple dialog using browser's built-in prompt
    const passphrase = prompt("Enter your private key passphrase:")
    if (passphrase === null) {
      resolve(null) // User cancelled
    } else {
      resolve(passphrase.trim() || null)
    }
  })
}

export async function downloadEncryptedFileWithDialog(address: string, doc: Document) {
  const passphrase = await showPassphraseDialog()
  if (passphrase) {
    const success = await downloadEncryptedFile(address, doc, passphrase)
    if (!success) {
      return false;
    }
    return true
  }
}
