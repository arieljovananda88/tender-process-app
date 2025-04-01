import { Request, Response } from "express";
import { utils } from "ethers";

const nonceStore: Record<string, string> = {};

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
      message: `Welcome to Tender dApp! Address: ${address} Nonce: ${nonce}`,
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

    const message = `Welcome to Tender dApp! Address: ${address} Nonce: ${nonce}`;
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
};
