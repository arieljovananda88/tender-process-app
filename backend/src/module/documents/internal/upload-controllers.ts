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
      documentFormat,
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

    if (!tenderId || !documentName || !documentType || !participantName || !participantEmail || !deadline || !v || !r || !s || !signer || !documentFormat) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Upload and encrypt file to IPFS
      const { result, symmetricKey, iv } = await uploadToIPFS(file.path, file.originalname);
      const cid = result.cid.toString();

      // Upload document with signature to smart contract
      const documentStore = getDocumentStoreContractInstance();
      const publicKeyStorageContract = getPublicKeyStoregeContractInstance()
      const uploadInput = {
        tenderId,
        documentCid: cid,
        documentName,
        documentType,
        documentFormat,
        participantName,
        participantEmail,
        deadline,
        v,
        r,
        s
      };
      const uploadDocumentTx = await documentStore.uploadDocumentWithSignature(uploadInput);
      await uploadDocumentTx.wait();

      // Get tender owner and emit keys
      const tenderManager = getTenderManagerContractInstance();
      const owner = await tenderManager.getOwner(tenderId);

      const ownerPublicKeyInContract = await publicKeyStorageContract.getPublicKey(owner);
      const participantPublicKeyInContract = await publicKeyStorageContract.getPublicKey(signer);

      const ownerPem = jwkToPem(JSON.parse(ownerPublicKeyInContract));
      const participantPem = jwkToPem(JSON.parse(participantPublicKeyInContract));

      const symmetricKeyBuffer = Buffer.from(symmetricKey, "utf8");

      const ownerEncryptedSymmetricBuffer = crypto.publicEncrypt(
        {
          key: ownerPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        symmetricKeyBuffer
      );

      const participantEncryptedSymmetricBuffer = crypto.publicEncrypt(
        {
          key: participantPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        symmetricKeyBuffer
      );

      const ownerEncryptedSymmetricKey = ownerEncryptedSymmetricBuffer.toString('base64');
      const participantEncryptedSymmetricKey = participantEncryptedSymmetricBuffer.toString('base64');

      const ownerDocument = await documentStore.getDocumentOwner(cid);

      const keyManager = getKeyManagerContractInstance();
      const emitKeyOwnerTx = await keyManager.emitKey({
        receiver: owner,
        encryptedKey: ownerEncryptedSymmetricKey,
        iv,
        cid,
        tenderId,
        documentName,
        v,
        r,
        s, deadline});
      await emitKeyOwnerTx.wait();

      const emitKeySignerTx = await keyManager.emitKey({
        receiver: signer,
        encryptedKey: participantEncryptedSymmetricKey,
        iv,
        cid,
        tenderId,
        documentName,
        v,
        r,
        s, deadline});
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

async function requestAccess(req: any, res: any) {
  try {
    const { receiver, cid, fileName, v, r, s, deadline } = req.body;

    if (!receiver || !cid || !fileName || !v || !r || !s || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    const keyManager = getKeyManagerContractInstance();
    const requestAccessTx = await keyManager.requestAccess(receiver, cid, fileName, v, r, s, deadline);
    await requestAccessTx.wait();
  
    return res.status(200).json({
      success: true,
      message: "Access requested successfully",
      transactionHash: requestAccessTx.hash
    });
  } catch (error: any) {
    console.error("Request access error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

async function uploadInfoDocument(req: any, res: any) {
  handleFileUpload(req, res, async function(err: any) {
    const { file } = req;

    if (err || !file) {
      return res.status(400).json({ error: err ? 'File upload failed' : 'No file provided' });
    }

    try {
      const documentStore = getDocumentStoreContractInstance();
      const { tenderId, documentName, deadline, v, r, s, documentFormat } = req.body;
      const { create } = await import("ipfs-http-client");
      const ipfs = initIPFSClient(create);
      
      const fileContent = fs.readFileSync(file.path);
      
      const result = await ipfs.add({ path: file.originalname, content: fileContent });
      fs.unlinkSync(file.path);
      
      const cid = result.cid.toString();

      const uploadInput = {
        tenderId,
        documentCid: cid,
        documentName,
        documentType: "",
        documentFormat,
        participantName: "",
        participantEmail: "",
        deadline,
        v,
        r,
        s
      };

      const uploadDocumentTx = await documentStore.uploadTenderInfoDocumentWithSignature(uploadInput);
      await uploadDocumentTx.wait();

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
  uploadInfoDocument,
  requestAccess
};
