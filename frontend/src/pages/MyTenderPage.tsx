import { useEffect, useState } from "react"
import { SearchHeader } from "@/components/SearchHeader"
import { TenderCard } from "@/components/TenderCard"
import { createTender, getMyTenders, type Tender } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { ethers } from "ethers"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"

interface TenderFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

// async function example() {
//   // 1. Generate key pair
//   const keyPair = await generateKeyPair();

//   console.log(keyPair.privateKey)

//   const jwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
//   const privateKeyString = JSON.stringify(jwk);

//   const passphrase = "my-secret-password";

//   const encryptedResult = await encryptPrivateKeyWithPassphrase(privateKeyString, passphrase);

//   const encKey = btoa(String.fromCharCode(...encryptedResult.encryptedData));

//   const encKeyUint8Array = base64ToUint8Array(encKey);

//   const decryptedResult = await tryDecryptAndParseJSON(encKeyUint8Array, "my-secret-password");

//   if (!decryptedResult.success) {
//     toast.error("Failed to decrypt private key");
//     return;
//   }

//   const privateKey = await importPrivateKeyFromJWK(decryptedResult.parsed);
//   // 2. Encrypt some data with the public key
//   const data = new TextEncoder().encode("Hello world");

//   const encryptedData = await window.crypto.subtle.encrypt(
//     {
//       name: "RSA-OAEP",
//     },
//     keyPair.publicKey,
//     data
//   );

//   // 3. Decrypt data with the private key
//   const decryptedText = await decryptData(privateKey, encryptedData);

//   console.log("Decrypted text:", decryptedText);
// }

//   request.onerror = () => {
//     console.error("Failed to fetch encrypted key:", request.error);
//   };
// }


export default function MyTenders() {
  const { address } = useAccount();
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isConnected } = useAccount()
  const [formData, setFormData] = useState<TenderFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // useEffect(() => {
  //   example()
  //   example2(address as string)
  // }, [])

  const handleCreateTender = async () => {
    try {
      setIsSubmitting(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['uint256'],
          [deadline]
        )
      );

      // Sign the message
      const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));
      const { v, r, s } = ethers.utils.splitSignature(signature);

      // Format dates to ISO string with time set to midnight UTC
      const startDate = new Date(formData.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(formData.endDate);
      endDate.setUTCHours(0, 0, 0, 0);

      const response = await createTender(
        formData.name,
        formData.description,
        startDate.toISOString(),
        endDate.toISOString(),
        deadline,
        v,
        r,
        s
      );

      if (response.success) {
        setIsDialogOpen(false);
        // Refresh tenders list
        const tenders = await getMyTenders(address as string);
        if (tenders) {
          setTenders(tenders);
        }
        toast.success("Tender created successfully")
      } else {
        alert('Failed to create tender');
      }
    } catch (error) {
      console.error("Error creating tender:", error);
      alert("Failed to create tender. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const tenders = await getMyTenders(address as string)
        if (tenders) {
          setTenders(tenders)
        } else {
          setError("Failed to fetch tenders")
        }
      } catch (err) {
        setError("An error occurred while fetching tenders")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTenders()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SearchHeader title="Search Tenders" />
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <SearchHeader title="Search Tenders" />
        <div className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SearchHeader title="Search Tenders" />

      <div className="p-6">
        {isConnected && (
          <div className="mb-6 flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800">
                  Create New Tender
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Tender</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter tender name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter tender description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreateTender}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Tender'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tenders.map((tender, index) => (
            <TenderCard
              key={index}
              id={tender.tenderId}
              owner={tender.owner}
              name={tender.name}
              description={tender.description}
              startDate={tender.startDate}
              endDate={tender.endDate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
