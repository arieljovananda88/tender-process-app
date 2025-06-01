import fs from "fs";
import { ethers } from "ethers";
import { encrypt } from "eciesjs";
import { initIPFSClient, handleFileUpload } from "./commons";
import { getDocumentStoreContractInstance } from "../../../commons/contract-clients";

const dummyPrivateKey = "";
const wallet = new ethers.Wallet(dummyPrivateKey);
const dummyPublicKey = Buffer.from(wallet.publicKey.slice(2), 'hex');


async function uploadToIPFS(filePath: string, fileName: string) {
  const { create } = await import("ipfs-http-client");
  const ipfs = initIPFSClient(create);
  
  // Read and encrypt file contents
  const fileContent = fs.readFileSync(filePath);
  const encryptedContent = encrypt(dummyPublicKey, fileContent);
  
  // Upload encrypted content
  const result = await ipfs.add({ path: fileName, content: encryptedContent });
  fs.unlinkSync(filePath); // Cleanup
  return result;
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
    participantName,
    participantEmail,
    deadline,
    v,
    r,
    s,
    signer
  } = req.body;

  if (!tenderId || !documentCid || !documentName || !documentType || !participantName || !participantEmail || !deadline || !v || !r || !s || !signer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const tx = await documentStore.uploadDocumentWithSignature(
      tenderId,
      documentCid,
      documentName,
      documentType,
      participantName,
      participantEmail,
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
