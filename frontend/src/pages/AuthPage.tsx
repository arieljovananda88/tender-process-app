import React, { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CardContainer } from "@/components/CardContainer"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BACKEND_URL = `http://localhost:${import.meta.env.VITE_BACKEND_PORT}`;

interface AuthResponse {
  success: boolean;
  message?: string;
}

interface NonceResponse {
  message: string;
}

interface IsRegisteredResponse {
  isRegistered: boolean;
}

const AuthPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authMessage, setAuthMessage] = useState<string>("");
  const [authStatus, setAuthStatus] = useState<string>("");
  const navigate = useNavigate();

  const isRegistered = async (): Promise<boolean> => {
    try {
      const res = await axios.get<IsRegisteredResponse>(`${BACKEND_URL}/auth/is-registered?address=${address}`);
      return res.data.isRegistered;
    } catch (err) {
      console.error("Failed to check registration", err);
      return false;
    }
  };

  const fetchNonce = async (): Promise<string> => {
    try {
      const res = await axios.get<NonceResponse>(`${BACKEND_URL}/auth/nonce?address=${address}`);
      setAuthMessage(res.data.message);
      return res.data.message;
    } catch (err) {
      console.error("Failed to get nonce", err);
      throw err;
    }
  };

  const handleSign = async (): Promise<void> => {
    if (!address) {
      console.error("No wallet connected");
      return;
    }

    const registered = await isRegistered();
    if (!registered) {
      return navigate("/register");
    }

    try {
      const nonce = await fetchNonce();
      const signature = await signMessageAsync({ message: nonce });

      const res = await axios.post<AuthResponse>(`${BACKEND_URL}/auth/verify`, { address, signature });
      setAuthStatus(res.data.success ? "Authenticated!" : "Authentication Failed");

      if (res.data.success) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Signing failed", err);
      setAuthStatus("Authentication Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <CardContainer>
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
      </CardContainer>
    </div>
  );
};

export default AuthPage; 