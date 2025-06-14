import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { registerUser } from '@/lib/api';
import { generateKeyPair, encryptPrivateKeyWithPassphrase, openDB } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';

interface FormData {
  name: string;
  email: string;
}

const RegisterPage: React.FC = () => {
  const {address} = useAccount();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showKeyDialog, setShowKeyDialog] = useState<boolean>(false);
  const [passphrase, setPassphrase] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePassphraseChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassphrase(e.target.value);
  };

  const downloadPrivateKey = () => {
    const element = document.createElement('a');
    const file = new Blob([privateKey], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = 'private-key.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveEncryptedKey = async () => {
    if (!passphrase) {
      toast.error('Please enter a passphrase');
      return;
    }

    try {
      const privateKeyString = JSON.stringify(privateKey);
      const encryptedResult = await encryptPrivateKeyWithPassphrase(privateKeyString, passphrase);

      console.log(address);
      
      // Store encrypted key in IndexedDB
      const db = await openDB();
      const tx = db.transaction('encryptedKeys', 'readwrite');
      const store = tx.objectStore('encryptedKeys');
      
      console.log(db)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          address,
          encryptedKey: btoa(String.fromCharCode(...encryptedResult.encryptedData)),
        });
      
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      

      toast.success('Private key encrypted and stored successfully');
      setShowKeyDialog(false);
      navigate('/auth');
    } catch (error) {
      console.error('Error saving encrypted key:', error);
      toast.error('Failed to save encrypted key');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const newKeyPair = await generateKeyPair();
      const publicKey =await window.crypto.subtle.exportKey("jwk", newKeyPair.publicKey);

      // Export private key as JWK
      const jwk = await window.crypto.subtle.exportKey("jwk", newKeyPair.privateKey);
      setPrivateKey(JSON.stringify(jwk));

      const response = await registerUser(formData.name, formData.email, address, JSON.stringify(publicKey));

      if (response.success) {
        toast.success('Registration successful!');
        setShowKeyDialog(true);
      } else {
        toast.error('Registration failed: ' + response.error);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      if (error instanceof Error && error.message === "Public key has already been registered") {
        alert('This wallet is already registered. Please proceed to authentication.');
        navigate('/auth');
      } else {
        alert('Registration failed. See console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mb-6 p-6">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">Register Your Account</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                name="name"
                type="name"
                required
                placeholder="Enter your name" 
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your Email" 
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </Card>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Private Key</DialogTitle>
            <DialogDescription>
              Please download your private key and set a passphrase to encrypt it for local storage.
              Keep your private key safe and never share it with anyone.
              The private key will NOT be stored on the server, and will NOT be shown again.
              Only you know your private key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button 
              onClick={downloadPrivateKey}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              Download Private Key
            </Button>
            <div className="space-y-2">
              <Label htmlFor="passphrase">Passphrase for Local Storage</Label>
              <Input
                id="passphrase"
                type="password"
                placeholder="Enter passphrase"
                value={passphrase}
                onChange={handlePassphraseChange}
              />
            </div>
            <Button 
              onClick={handleSaveEncryptedKey}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Save Encrypted Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterPage; 