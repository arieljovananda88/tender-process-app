import { Request, Response } from "express";
import { Wallet } from "ethers";

// Controller to create a new Sepolia Testnet wallet
async function createWallet(req: Request, res: Response) {
  try {
    const wallet = Wallet.createRandom();

    // Return wallet details
    return res.status(200).json({
      success: true,
      message: "Wallet created successfully",
      address: wallet.address,
      privateKey: wallet.privateKey, 
      mnemonic: wallet.mnemonic?.phrase, 
      network: "Sepolia Testnet"
    });

  } catch (error: any) {
    console.error("Wallet creation error:", error);
    return res.status(500).json({ error: "Failed to create wallet", details: error.message });
  }
}

// Export the controller
export const walletController = {
  createWallet
};
