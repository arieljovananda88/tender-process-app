import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { encrypt, decrypt } from "eciesjs";
import { Buffer } from "buffer";
import documentStoreArtifact from "../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json";

// Polyfill Buffer for browser environment
window.Buffer = Buffer;

function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState("Hello Blockchain!");
  const [encryptedData, setEncryptedData] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [recoveredPublicKey, setRecoveredPublicKey] = useState("");
  const [myPublicKey, setMyPublicKey] = useState("");
  const [myPrivateKey, setMyPrivateKey] = useState("308184020100301006072a8648ce3d020106052b8104000a046d306b020101042068fddc1db4616716f5a3294bdddd363b5f29cb36baff141d185ad080eac7f957a1440342000492ecb5849c783b4590cb89f90076bf19c04aa0d3c9adea2611f1de8afbd3b1b283ac6502dead591d6ee81adb7c7476103ff68e7531f4ffd705a4b1169d0b8efd");
  const [myDocuments, setMyDocuments] = useState([]);
  const [Documents, setDocuments] = useState([]);

  function extractRawPublicKey(asn1Hex) {
    const hex = asn1Hex.replace(/^0x/, '');
    const match = hex.match(/04([0-9a-fA-F]{128})(?:[^0-9a-fA-F]|$)/);
    if (match) {
      return Buffer.from('04' + match[1], 'hex');
    }
    throw new Error('Unable to extract a valid EC point from the public key');
  }
  
  function extractRawPrivateKey(asn1Hex) {
    const hex = asn1Hex.replace(/^0x/, '');
    const privateKeyMarker = hex.indexOf('0201010420');
    if (privateKeyMarker !== -1) {
      return Buffer.from(hex.slice(privateKeyMarker + 10, privateKeyMarker + 10 + 64), 'hex');
    }
    throw new Error('Invalid private key format');
  }

  const handleEncrypt = async () => {
    try {
      const rawPublicKey = extractRawPublicKey(myPublicKey);
      const encrypted = encrypt(rawPublicKey, Buffer.from(message));
      setEncryptedData(encrypted.toString("hex"));
    } catch (error) {
      console.error("Encryption error:", error);
    }
  };
  
  const handleDecrypt = async () => {
    try {
      const encryptedBuffer = Buffer.from("043b4f8fa4469c67b42941c271e682f0078763ef3b401a77e3fdedecd1880e527e79710184aa770baf6a49afd9442451c7be48c5b5dbe08dd3675ccc473eaa7194a10452282e35b47ea2c8d1ee35a4e68e2b4aafa154cac934e92937ee8f7d82fc29087fc0868a3659c67067056bb22d1a88c848211695d2fe41d3a4866e53937fc915f3e4155ee632b36402de7395", "hex");
      const rawPrivateKey = extractRawPrivateKey(myPrivateKey);
      console.log(rawPrivateKey)
      const decrypted = decrypt(rawPrivateKey, encryptedBuffer);
      setDecryptedMessage(decrypted.toString());
    } catch (error) {
      console.error("Decryption error:", error);
    }
  };

  const getPublicKeyFromSignature = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0];
      const message = "Sign this message to reveal your public key";
      const messageHash = ethers.utils.hashMessage(message);
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, account]
      });
  
      const publicKey = ethers.utils.recoverPublicKey(messageHash, signature);
      setRecoveredPublicKey(publicKey);
    } catch (error) {
      console.error("Public key recovery error:", error);
    }
  };

  const fetchMyDocumentsFromTender2 = async () => {
    try {
      if (!address || !isConnected) {
        alert("Please connect your wallet first.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const documentStoreAddress = "0x5d0033744F5Be70fBC2A366358f0Da563175C3c2";

      const contract = new ethers.Contract(documentStoreAddress, documentStoreArtifact.abi, signer);

      const tenderId = ethers.utils.formatBytes32String("2");

      const docs = await contract.getMyDocuments(tenderId);
      console.log("Fetched documents:", docs);
      setMyDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchDocumentsFromTender2 = async () => {
    try {
      if (!address || !isConnected) {
        alert("Please connect your wallet first.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const documentStoreAddress = "0x5d0033744F5Be70fBC2A366358f0Da563175C3c2";

      const contract = new ethers.Contract(documentStoreAddress, documentStoreArtifact.abi, signer);

      const tenderId = ethers.utils.formatBytes32String("2");

      const docs = await contract.getDocumentsOfTenderAsOwner(tenderId, "0x48dbd83Dc991955D21b0B741b66190b0Bc7bbA0f");
      console.log("Fetched documents:", docs);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Tender dApp Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Public Key Recovery</h2>
          <button 
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            onClick={getPublicKeyFromSignature}
          >
            Recover Public Key from Signature
          </button>
          <p className="mt-2 text-sm text-gray-600">Recovered Public Key: {recoveredPublicKey}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Encryption</h2>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <div className="space-x-2">
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={handleEncrypt}
            >
              Encrypt
            </button>
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              onClick={handleDecrypt}
            >
              Decrypt
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">Encrypted: {encryptedData}</p>
            <p className="text-sm text-gray-600">Decrypted: {decryptedMessage}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Documents</h2>
          <div className="space-x-2 mb-4">
            <button 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
              onClick={fetchMyDocumentsFromTender2}
            >
              Fetch My Documents
            </button>
            <button 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
              onClick={fetchDocumentsFromTender2}
            >
              Fetch Documents as Owner
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">My Documents</h3>
              <ul className="space-y-2">
                {myDocuments.map((doc, i) => (
                  <li key={i} className="border p-2 rounded shadow">
                    📄 <strong>{doc.documentName}</strong><br />
                    🕒 {new Date(Number(doc.submissionDate) * 1000).toLocaleString()}<br />
                    🔗 CID: {doc.documentCid}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Documents as Owner</h3>
              <ul className="space-y-2">
                {Documents.map((doc, i) => (
                  <li key={i} className="border p-2 rounded shadow">
                    📄 <strong>{doc.documentName}</strong><br />
                    🕒 {new Date(Number(doc.submissionDate) * 1000).toLocaleString()}<br />
                    🔗 CID: {doc.documentCid}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 