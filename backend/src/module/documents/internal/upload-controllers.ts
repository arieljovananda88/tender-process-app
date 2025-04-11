import fs from "fs";
import { ethers } from "ethers";
import { encrypt } from "eciesjs";
import { initIPFSClient, handleFileUpload } from "./commons";
import { getDocumentStoreContractInstance, getPublicKeyStoregeContractInstance } from "../../../commons/contract-clients";



// Function to upload document to IPFS
async function uploadDocument(req: any, res: any) {
  const documentStoreContract = getDocumentStoreContractInstance()
  const publicKeyStorageContract = getPublicKeyStoregeContractInstance()
  
  try {
    // Use the multer middleware first
    handleFileUpload(req, res, async function(err: any) {
      const fileName = req.body.file_name;
      const address = req.body.address;

      
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ error: 'File upload failed' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { create } = await import("ipfs-http-client");

      // Initialize IPFS client
      const ipfs = initIPFSClient(create);

      
      
      try {
        // Read the file from disk
        const fileContent = fs.readFileSync(req.file.path);
        
        // Add the file to IPFS
        const result = await ipfs.add({
          path: req.file.originalname,
          content: fileContent
        });
        
        // Construct the IPFS URI
        const ipfsUri = `ipfs://${result.cid.toString()}`;
        const ipfsGatewayUrl = `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${result.cid.toString()}`;
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);

        const publicKeyInContract = await publicKeyStorageContract.getPublicKey(address);
        if (!publicKeyInContract) {
            return res.status(400).json({ error: "address doesnt exist in the app" });
        }

        const encryptedCid = await handleEncrypt(publicKeyInContract, result.cid.toString());

        if (!encryptedCid) {
          return res.status(500).json({ error: "Failed to encrypt CID" });
        }
        
        const tx = await documentStoreContract.uploadDocument(
          ethers.utils.formatBytes32String("1"),
          address,
          encryptedCid,
          fileName
        );
        
        await tx.wait();
        
        // Return success response
        return res.status(200).json({
          success: true,
          ipfsUri,
          ipfsGatewayUrl,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      } catch (ipfsError: any) {
        console.error('IPFS upload error:', ipfsError);
        
        // Clean up the temporary file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ error: 'IPFS upload failed', details: ipfsError.message });
      }
    });
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

function extractRawPublicKey(asn1Hex: string) {
  const hex = asn1Hex.replace(/^0x/, '');
  const match = hex.match(/04([0-9a-fA-F]{128})(?:[^0-9a-fA-F]|$)/);
  if (match) {
    return Buffer.from('04' + match[1], 'hex');
  }

  throw new Error('Unable to extract a valid EC point from the public key');
}

const handleEncrypt = async (publicKey: string, cid: string) => {
  try {
    const rawPublicKey = extractRawPublicKey(publicKey);
    const encrypted = encrypt(rawPublicKey, Buffer.from(cid));
    return (encrypted.toString("hex"))
  } catch (error) {
    console.error("Encryption error:", error);
  }
};

export const uploadDocumentController = {
  uploadDocument
}