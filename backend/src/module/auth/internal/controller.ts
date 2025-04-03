import { Request, Response } from "express";
import { ethers, utils, Wallet} from "ethers";
import dotenv from "dotenv";
import PublicKeyStorageABI from "../../../../artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json"

const nonceStore: Record<string, string> = {};

dotenv.config();

async function register(req: Request, res: Response){
    const API_KEY = process.env.API_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const CONTRACT_ADDRESS = process.env.PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;

    if (!PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY is not set in environment variables");
    }

    if (!CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS is not set in environment variables");
    }
      
    const contractAbi = PublicKeyStorageABI.abi;
      
    const alchemyProvider = new ethers.providers.AlchemyProvider("sepolia", API_KEY);
    const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
    const publicKeyStorageContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer)
    
    try{
        const { publicKey, address, name } = req.body;
        if (!publicKey || !address) {
        return res.status(400).json({ error: "Missing public key or address or name" });
        }
        const publicKeyInContract = await publicKeyStorageContract.getPublicKey(address)
        if (publicKeyInContract) {
            return res.status(400).json({ error: "public key has already been registered" });
        }
        await publicKeyStorageContract.storePublicKey(address, publicKey, name)
        return res.status(200).json({
            success: true,
            message: "Registration successful",
          });
    }catch(error: any){
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

export const authController = {
  getNonce,
  verifySignature,
  register
};
