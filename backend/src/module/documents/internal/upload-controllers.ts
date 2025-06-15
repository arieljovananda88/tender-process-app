import fs from "fs";
import { ethers } from "ethers";
import { encrypt } from "eciesjs";
import crypto from "crypto";
import { initIPFSClient, handleFileUpload } from "./commons";
import { getDocumentStoreContractInstance, getKeyManagerContractInstance, getPublicKeyStoregeContractInstance, getTenderManagerContractInstance } from "../../../commons/contract-clients";
import jwkToPem from 'jwk-to-pem';


function generateSymmetricKey() {
    return crypto.randomBytes(32); // 256 bits for AES-256
}

async function uploadToIPFS(filePath: string, fileName: string) {
  const { create } = await import("ipfs-http-client");
  const ipfs = initIPFSClient(create);
  
  // Generate random symmetric key
  const symmetricKey = generateSymmetricKey();
  
  // Read file contents
  const fileContent = fs.readFileSync(filePath);
  
  // Encrypt file with symmetric key
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);
  const encryptedContent = Buffer.concat([
      cipher.update(fileContent),
      cipher.final()
  ]);
  
  // Upload encrypted content
  const result = await ipfs.add({ path: fileName, content: encryptedContent });
  fs.unlinkSync(filePath); // Cleanup
  
  return {
      result,
      symmetricKey: symmetricKey.toString('hex'),
      iv: iv.toString('hex')
  };
}

async function uploadDocument(req: any, res: any) {
  handleFileUpload(req, res, async function(err: any) {
    const { file } = req;
    const {
      tenderId,
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

    if (err || !file) {
      return res.status(400).json({ error: err ? 'File upload failed' : 'No file provided' });
    }

    if (!tenderId || !documentName || !documentType || !participantName || !participantEmail || !deadline || !v || !r || !s || !signer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Upload and encrypt file to IPFS
      const { result, symmetricKey, iv } = await uploadToIPFS(file.path, file.originalname);
      const cid = result.cid.toString();

      // Upload document with signature to smart contract
      const documentStore = getDocumentStoreContractInstance();
      const publicKeyStorageContract = getPublicKeyStoregeContractInstance()
      const uploadDocumentTx = await documentStore.uploadDocumentWithSignature(
        tenderId,
        cid,
        documentName,
        documentType,
        participantName,
        participantEmail,
        deadline,
        v,
        r,
        s
      );
      await uploadDocumentTx.wait();

      // Get tender owner and emit keys
      const tenderManager = getTenderManagerContractInstance();
      const owner = await tenderManager.getOwner(tenderId);

      const ownerPublicKeyInContract = await publicKeyStorageContract.getPublicKey(owner);

      const pem = jwkToPem(JSON.parse(ownerPublicKeyInContract));

      const symmetricKeyBuffer = Buffer.from(symmetricKey, "utf8");

      const ownerEncryptedSymmetricBuffer = crypto.publicEncrypt(
        {
          key: pem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        symmetricKeyBuffer
      );

      const ownerEncryptedSymmetricKey = ownerEncryptedSymmetricBuffer.toString('base64');

      const keyManager = getKeyManagerContractInstance();
      const emitKeyOwnerTx = await keyManager.emitKey(owner, ownerEncryptedSymmetricKey, iv, cid, v, r, s, deadline); //TODO encrypt symmetricKey with public key of owner
      await emitKeyOwnerTx.wait();

      const emitKeySignerTx = await keyManager.emitKey(signer, symmetricKey, iv, cid, v, r, s, deadline); //TODO encrypt symmetricKey with public key of signer
      await emitKeySignerTx.wait();

      return res.status(200).json({
        success: true,
        message: "Document uploaded and encrypted successfully",
        ipfsUri: `ipfs://${cid}`,
        ipfsGatewayUrl: `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${cid}`,
        filename: file.originalname,
        cid: cid,
        size: file.size,
        mimetype: file.mimetype,
        symmetricKey,
        iv,
        transactionHash: uploadDocumentTx.hash,
        emitKeyOwnerTransactionHash: emitKeyOwnerTx.hash,
        emitKeySignerTransactionHash: emitKeySignerTx.hash
      });
    } catch (error: any) {
      console.error("Upload document error:", error);
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });
}

async function uploadFile(req: any, res: any) {
  handleFileUpload(req, res, async function(err: any) {
    const { file } = req;

    if (err || !file) {
      return res.status(400).json({ error: err ? 'File upload failed' : 'No file provided' });
    }

    try {
      const { create } = await import("ipfs-http-client");
      const ipfs = initIPFSClient(create);
      
      const fileContent = fs.readFileSync(file.path);
      
      const result = await ipfs.add({ path: file.originalname, content: fileContent });
      fs.unlinkSync(file.path);
      
      const cid = result.cid.toString();

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        ipfsUri: `ipfs://${cid}`,
        ipfsGatewayUrl: `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${cid}`,
        filename: file.originalname,
        cid: cid,
        size: file.size,
        mimetype: file.mimetype
      });
    } catch (error: any) {
      console.error("Upload file error:", error);
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });
}

export const uploadDocumentController = {
  uploadDocument,
  uploadFile
};
