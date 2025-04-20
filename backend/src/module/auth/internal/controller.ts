import { Request, Response } from "express";
import { utils} from "ethers";
import { generateKeyPairSync } from 'crypto';
import { Buffer } from 'buffer';
import dotenv from "dotenv";
import { getPublicKeyStoregeContractInstance } from "../../../commons/contract-clients";

const nonceStore: Record<string, string> = {};

dotenv.config();

async function register(req: Request, res: Response) {
  const publicKeyStorageContract = getPublicKeyStoregeContractInstance()

  try {
      const { email, address, name } = req.body;
      if (!email || !address || !name) {
          return res.status(400).json({ error: "Missing email, address or name" });
      }

      const publicKeyInContract = await publicKeyStorageContract.getPublicKey(address);
      if (publicKeyInContract) {
          return res.status(400).json({ error: "Public key has already been registered" });
      }


      // Generate key pair
      const { publicKey, privateKey } = generateKeyPairSync('ec', {
          namedCurve: 'secp256k1',
          publicKeyEncoding: { type: 'spki', format: 'der' },
          privateKeyEncoding: { type: 'pkcs8', format: 'der' },
      });

      const publicKeyHex = Buffer.from(publicKey).toString('hex');
      const privateKeyHex = Buffer.from(privateKey).toString('hex');

      await publicKeyStorageContract.storeUserInfo(address, email, name, publicKeyHex);

      return res.status(200).json({
          success: true,
          message: "Registration successful",
          publicKey: publicKeyHex,
          privateKey: privateKeyHex
      });
  } catch (error: any) {
      console.error("registration error:", error);
      return res.status(500).json({ error: "Failed to register user", details: error.message });
  }
}


// Generate nonce
async function getNonce(req: Request, res: Response) {
  try {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: "Missing wallet address in query param" });
    }

    const nonce = Math.floor(Math.random() * 1000000).toString();
    nonceStore[address.toLowerCase()] = nonce;

    return res.status(200).json({
      success: true,
      nonce,
      message: `${address} Nonce: ${nonce}`,
    });
  } catch (error: any) {
    console.error("Nonce generation error:", error);
    return res.status(500).json({ error: "Failed to generate nonce", details: error.message });
  }
}

// Verify signature
async function verifySignature(req: Request, res: Response) {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: "Missing address or signature" });
    }

    const nonce = nonceStore[address.toLowerCase()];
    if (!nonce) {
      return res.status(400).json({ error: "Nonce not found for address" });
    }

    const message = `${address} Nonce: ${nonce}`;
    const recoveredAddress = utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    delete nonceStore[address.toLowerCase()];

    return res.status(200).json({
      success: true,
      message: "Authentication successful",
    });
  } catch (error: any) {
    console.error("Signature verification error:", error);
    return res.status(500).json({ error: "Failed to verify signature", details: error.message });
  }
}

async function isRegistered(req: Request, res: Response) {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "Missing wallet address in query param" });
    }

    const publicKeyStorageContract = getPublicKeyStoregeContractInstance();
    const publicKeyInContract = await publicKeyStorageContract.getPublicKey(address);
    if (!publicKeyInContract) {
      return res.status(200).json({
        success: true,
        isRegistered: false,
      });
    }

    return res.status(200).json({
      success: true,
      isRegistered: true,
    });
  } catch (error: any) {
    console.error("Check registration error:", error);
    return res.status(500).json({ error: "Failed to check registration status", details: error.message });
  }
}

export const authController = {
  getNonce,
  verifySignature,
  register,
  isRegistered
};
