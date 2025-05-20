import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { registerUser } from '@/lib/api';
import saveToIndexedDB from '@/hooks/useIndexedDB';

interface FormData {
  name: string;
  email: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      // Generate key pair
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        true,
        ["deriveKey"]
      );

      // Export keys
      const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
      const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

      // Store private key
      await saveToIndexedDB(privJwk);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const response = await registerUser(
        formData.name, 
        formData.email, 
        address,
        JSON.stringify(pubJwk)
      );

      if (response.success) {
        alert('Registration successful!');
        navigate('/auth');
      } else {
        alert('Registration failed: ' + response.error);
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
    </div>
  );
};

export default RegisterPage; 