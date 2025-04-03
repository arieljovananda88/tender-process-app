import React, { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import { Wallet, utils, ethers } from "ethers";
import { encrypt, decrypt } from "eciesjs";
import { Buffer } from "buffer";
import PublicKeyStorageABI from "../../backend/artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json"

// Polyfill Buffer for browser environment
window.Buffer = Buffer;

function App() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authMessage, setAuthMessage] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [message, setMessage] = useState("Hello Blockchain!");
  const [encryptedData, setEncryptedData] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [recoveredPublicKey, setRecoveredPublicKey] = useState("");
  const [registerStatus, setRegisterStatus] = useState("");

  // Generate a wallet (this should be done securely)
  const mnemonic = "radar theory exit spare dog stay between series render decrease gorilla draft";
  const walletMnemonic = Wallet.fromMnemonic(mnemonic);
  const walletPrivate = new Wallet(walletMnemonic.privateKey);

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
      if (!address) {
        console.error("No wallet connected");
        return;
      }
      const signature = await signMessageAsync({ message: authMessage });
  
      const res = await axios.post(`http://localhost:9000/auth/verify`, { address, signature });
      setAuthStatus(res.data.success ? "✅ Authenticated!" : "❌ Authentication Failed");
    } catch (err) {
      console.error("❌ Signing failed", err);
      setAuthStatus("❌ Authentication Failed");
    }
  };

  const handleEncrypt = async () => {
    try {
      const publicKey = Buffer.from(recoveredPublicKey.slice(2), "hex");
      const encrypted = encrypt(publicKey, Buffer.from(message));
      setEncryptedData(encrypted.toString("hex"));
    } catch (error) {
      console.error("Encryption error:", error);
    }
  };

  const handleDecrypt = async () => {
    try {
      const encryptedBuffer = Buffer.from(encryptedData, "hex");
      const privateKey = Buffer.from(walletMnemonic.privateKey.slice(2), "hex");
      const decrypted = decrypt(privateKey, encryptedBuffer);
      setDecryptedMessage(decrypted.toString());
    } catch (error) {
      console.error("Decryption error:", error);
    }
  };

  const getPublicKeyFromSignature = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0];
      const message = "Sign this message to reveal your public key";
      const messageHash = utils.hashMessage(message);
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, account]
      });
  
      const publicKey = utils.recoverPublicKey(messageHash, signature);
      setRecoveredPublicKey(publicKey);
    } catch (error) {
      console.error("Public key recovery error:", error);
    }
  };

  // Handle Registering the User's Public Key
  const handleRegister = async () => {
    const env = await import.meta.env;
    console.log(env)
    const CONTRACT_ADDRESS = env.VITE_PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;

    if (!CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS is not set in environment variables");
    }
      
    const contractAbi = PublicKeyStorageABI.abi;
      
    const provider = new ethers.providers.Web3Provider(web3.currentProvider);

    const signer = provider.getSigner();
    const publicKeyStorageContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer)
    
    try{
        const publicKeyInContract = await publicKeyStorageContract.getPublicKey(address)
        if (publicKeyInContract) {
          setRegisterStatus("already registered for wallet address")
        }
        await publicKeyStorageContract.storePublicKey(recoveredPublicKey)
        setRegisterStatus("register successful") 
    }catch(error){
      setRegisterStatus(`register failed: ${error}`) 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Tender dApp</h1>
      <ConnectButton />
      {isConnected && (
        <>
          <p>Connected Wallet: {address}</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSign}>
            Sign & Authenticate
          </button>
          <p>{authStatus}</p>
        </>
      )}
      <h2 className="text-xl font-bold mt-4">Public Key Recovery</h2>
      <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={getPublicKeyFromSignature}>
        Recover Public Key from Signature
      </button>
      <p>Recovered Public Key: {recoveredPublicKey}</p>

      {/* Register Button */}
      <h2 className="text-xl font-bold mt-4">Register Public Key</h2>
      <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleRegister}>
        Register
      </button>
      <p>{registerStatus}</p>

      <h2 className="text-xl font-bold mt-4">Encryption</h2>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border p-2"
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleEncrypt}>
        Encrypt
      </button>
      <p>Encrypted: {encryptedData}</p>
      <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleDecrypt}>
        Decrypt
      </button>
      <p>Decrypted: {decryptedMessage}</p>
    </div>
  );
}

export default App;
