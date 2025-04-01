import React, { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";

function App() {
  const { address, isConnected } = useAccount();
  const [authMessage, setAuthMessage] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    if (isConnected) {
      fetchNonce();
    }
  }, [isConnected]);

  const fetchNonce = async () => {
    try {
      const res = await axios.get(`http://localhost:9000/auth/nonce?address=${address}`);
      setAuthMessage(res.data.message);
    } catch (err) {
      console.error("Failed to get nonce", err);
    }
  };

  const handleSign = async () => {
    try {
      const signature = await signMessageAsync({ message: authMessage });
      const res = await axios.post(`http://localhost:9000/auth/verify`, {
        address,
        signature,
      });
      if (res.data.success) {
        setAuthStatus("✅ Authenticated!");
      } else {
        setAuthStatus("❌ Authentication Failed");
      }
    } catch (err) {
      console.error("Signing failed", err);
      setAuthStatus("❌ Authentication Failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Tender dApp Auth</h1>
      <ConnectButton />
      {isConnected && (
        <>
          <p>Connected Wallet: {address}</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleSign}
          >
            Sign & Authenticate
          </button>
          <p>{authStatus}</p>
        </>
      )}
    </div>
  );
}

export default App;
