import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { checkIsRegistered } from "@/lib/api_contract";
import { Wallet } from "ethers";
import { getPublicKeyStorageContract } from "@/lib/contracts";

const AuthPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [authStatus, setAuthStatus] = useState<string>("");
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string, publicKey: string, mnemonic: string, network: string } | null>(null);
  const navigate = useNavigate();

  const handleSign = async (): Promise<void> => {
    if (!address) {
      console.error("No wallet connected");
      return;
    }

    const registered = await checkIsRegistered(address);
    if (!registered) {
      return navigate("/register");
    }

      setAuthStatus("Waiting to log in...");

      const contract = await getPublicKeyStorageContract();

      const email = await contract.getEmail(address);
      const name = await contract.getName(address);
      const role = await contract.getRole(address); 
      localStorage.setItem("user", JSON.stringify({ address, name: name, email: email, role: role}));
      localStorage.setItem("tender_app_address", address);
      
      navigate("/tenders/search");
  };

  const handleCreateWallet = () => {
    const wallet = Wallet.createRandom();
    setGeneratedWallet({
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic?.phrase,
      network: "ETH"
    });
    setShowWalletDialog(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-center mb-6">Welcome to Tender dApp</h1>
          <p className="text-gray-600 text-center mb-8">
            Connect your wallet to get started with the decentralized tender process
          </p>

          <div className="flex justify-center mb-4">
            <ConnectButton />
          </div>

          {isConnected && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">Connected Wallet: {address}</p>

              <Button
                variant="default"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleSign}
              >
                Log In
              </Button>

              <Label className="text-center block mt-4">Have not registered? register here</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>

              <p className="text-center">{authStatus}</p>
            </div>
          )}

          {!isConnected && (
            <div className="text-center mt-4">
              <Label className="text-sm text-gray-500">{"Don't have a wallet? "}</Label>
              <Button
                variant="link"
                className="text-blue-500 hover:text-blue-600 p-0 h-auto"
                onClick={handleCreateWallet}
              >
                Create one here
              </Button>
            </div>
          )}

        </Card>
      </div>

      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generated Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Address:</Label>
              <p className="text-sm text-gray-600 break-all">{generatedWallet?.address}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Private Key:</Label>
              <p className="text-sm text-gray-600 break-all">{generatedWallet?.privateKey}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Public Key:</Label>
              <p className="text-sm text-gray-600 break-all">{generatedWallet?.publicKey}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Mnemonic:</Label>
              <p className="text-sm text-gray-600 break-all">{generatedWallet?.mnemonic}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Network:</Label>
              <p className="text-sm text-gray-600 break-all">{generatedWallet?.network}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Save the mnemonic and private key information securely. The private key and mnemonic are required to access your wallet if lost.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => setShowWalletDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthPage;