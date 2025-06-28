import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkIsRegistered, getNonce, verifySignature, getUser } from "@/lib/api";

const AuthPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authStatus, setAuthStatus] = useState<string>("");
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

    try {
      const nonce = await getNonce(address);
      const signature = await signMessageAsync({ message: nonce });

      const res = await verifySignature(address, signature);
      setAuthStatus(res.success ? "Authenticated!" : "Authentication Failed");

      if (res.success) {
        console.log("Authenticated!");
        const user = await getUser(address);
        localStorage.setItem("user", JSON.stringify({ address, name: user.name, email: user.email }));
        navigate("/tenders/search");
      }
    } catch (err) {
      console.error("Signing failed", err);
      setAuthStatus("Authentication Failed");
    }
  };

  return (
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
              Sign & Authenticate
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
      </Card>
    </div>
  );
};

export default AuthPage; 