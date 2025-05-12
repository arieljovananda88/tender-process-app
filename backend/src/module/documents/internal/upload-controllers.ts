import fs from "fs";
import { ethers } from "ethers";
import { encrypt } from "eciesjs";
import { initIPFSClient, handleFileUpload } from "./commons";
import { getDocumentStoreContractInstance, getPublicKeyStoregeContractInstance, getTenderManagerContractInstance } from "../../../commons/contract-clients";

// Helper: Encrypt CID using ECIES
// const handleEncrypt = async (publicKey: string, cid: string) => {
//   try {
//     const rawPublicKey = extractRawPublicKey(publicKey);
//     return encrypt(rawPublicKey, Buffer.from(cid)).toString("hex");
//   } catch (error) {
//     console.error("Encryption error:", error);
//     throw new Error("Encryption failed");
//   }
// };

// Helper: Extract EC public key point from ASN.1 string
// function extractRawPublicKey(asn1Hex: string): Buffer {
//   const hex = asn1Hex.replace(/^0x/, '');
//   const match = hex.match(/04([0-9a-fA-F]{128})(?:[^0-9a-fA-F]|$)/);
//   if (match) return Buffer.from('04' + match[1], 'hex');
//   throw new Error('Invalid EC public key format');
// }

// Helper: Upload file to IPFS and return result
async function uploadToIPFS(filePath: string, fileName: string) {
  const { create } = await import("ipfs-http-client");
  const ipfs = initIPFSClient(create);
  const fileContent = fs.readFileSync(filePath);
  const result = await ipfs.add({ path: fileName, content: fileContent });
  fs.unlinkSync(filePath); // Cleanup
  return result;
}

// Helper: Upload encrypted document CID to smart contract
async function uploadEncryptedDocument(contract: any, tenderID: string, address: string, encryptedCid: string, fileName: string, fileType: string) {
  const tx = await contract.uploadDocument(tenderID, address, encryptedCid, fileName, fileType);
  await tx.wait();
}

async function uploadDocument(req: any, res: any) {
  handleFileUpload(req, res, async function(err: any) {
    const { file } = req;
    const fileName = req.body.file_name;

    if (err || !file) {
      return res.status(400).json({ error: err ? 'File upload failed' : 'No file provided' });
    }

    try {
      const ipfsResult = await uploadToIPFS(file.path, file.originalname);
      const cid = ipfsResult.cid.toString();

      return res.status(200).json({
        success: true,
        ipfsUri: `ipfs://${cid}`,
        ipfsGatewayUrl: `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${cid}`,
        filename: file.originalname,
        cid: cid,
        size: file.size,
        mimetype: file.mimetype,
      });
    } catch (error: any) {
      console.error("Upload document error:", error);
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });
}

async function uploadDocumentWithSignature(req: any, res: any) {
  const documentStore = getDocumentStoreContractInstance();
  const {
    tenderId,
    documentCid,
    documentName,
    documentType,
    deadline,
    v,
    r,
    s,
    signer
  } = req.body;

  if (!tenderId || !documentCid || !documentName || !documentType || !deadline || !v || !r || !s || !signer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const tx = await documentStore.uploadDocumentWithSignature(
      tenderId,
      documentCid,
      documentName,
      documentType,
      deadline,
      v,
      r,
      s
    );
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully with signature",
      transactionHash: tx.hash
    });
  } catch (error: any) {
    console.error("Upload document with signature error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

export const uploadDocumentController = {
  uploadDocument,
  uploadDocumentWithSignature
};
