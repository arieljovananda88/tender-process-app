import React, { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = `http://localhost:${import.meta.env.VITE_BACKEND_PORT}`;

function AuthPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authMessage, setAuthMessage] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      checkRegistration();
    }
  }, [isConnected]);

  const checkRegistration = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/auth/is-registered?address=${address}`);
      if (!res.data.isRegistered) {
        navigate('/register');
        return;
      }
      fetchNonce();
    } catch (err) {
      console.error("Failed to check registration", err);
    }
  };

  const fetchNonce = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/auth/nonce?address=${address}`);
      setAuthMessage(res.data.message);
    } catch (err) {
      console.error("Failed to get nonce", err);
    }
  };

  const handleSign = async () => {
    try {
      if (!address) {
        console.error("No wallet connected");
        return;
      }
      const signature = await signMessageAsync({ message: authMessage });
  
      const res = await axios.post(`${BACKEND_URL}/auth/verify`, { address, signature });
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
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to Tender dApp</h1>
        <p className="text-gray-600 text-center mb-8">
          Connect your wallet to get started with the decentralized tender process
        </p>
        
        <div className="mb-6">
          <ConnectButton />
        </div>

        {isConnected && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Connected Wallet: {address}</p>
            
            <button 
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={handleSign}
            >
              Sign & Authenticate
            </button>
            <p className="text-center">{authStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthPage; 