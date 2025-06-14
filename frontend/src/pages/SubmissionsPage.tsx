"use client"

import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Building, FileText, File, FileImage, FileSpreadsheet } from "lucide-react"
import { Link } from "react-router-dom"
import { base64ToUint8Array, decryptData, formatDate, getKeyFromDB, importPrivateKeyFromJWK, tryDecryptAndParseJSON } from "@/lib/utils"
import { useDocumentStore, useTenderManager } from "@/hooks/useContracts"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { toast } from "react-toastify"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getKey, getUser } from "@/lib/api"
import { AES, enc, lib, mode, pad } from "crypto-js";

type Document = {
  documentCid: string;
  documentName: string;
  documentType: string;
  submissionDate: string;
};

interface Participant {
  address: string;
  name: string;
  email: string;
}

// Get file icon based on type or extension
const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return <FileText className="h-10 w-10 text-red-500" />
    case "doc":
    case "docx":
      return <File className="h-10 w-10 text-blue-500" />
    case "xls":
    case "xlsx":
      return <FileSpreadsheet className="h-10 w-10 text-green-500" />
    case "jpg":
    case "jpeg":
    case "png":
      return <FileImage className="h-10 w-10 text-purple-500" />
    default:
      return <File className="h-10 w-10 text-gray-500" />
  }
}

export default function ParticipantSubmissionsPage() {
  const params = useParams()
  const { address } = useAccount()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const tenderId = params.id as string
  const participantAddress = params.address as string
  const { fetchParticipantDocuments } = useDocumentStore()
  const { isPendingParticipant, addParticipant } = useTenderManager()
  const [isPending, setIsPending] = useState(false)
  const [documents, setDocuments] = useState<{ registrationDocuments: Document[], tenderDocuments: Document[] }>({
    registrationDocuments: [],
    tenderDocuments: []
  });

  useEffect(() => {
    const loadData = async () => {
      if (tenderId && participantAddress) {
        const docs = await fetchParticipantDocuments(tenderId, participantAddress);
        if (docs) {
          setDocuments(docs);
        }
        console.log(tenderId, participantAddress)
        const pending = await isPendingParticipant(tenderId, participantAddress);
        const participant = await getUser(participantAddress);
        setParticipant({
          address: participantAddress,
          name: participant.name,
          email: participant.email
        });
        setIsPending(pending); 
      }
    };
    loadData();
  }, []);


  const handleDownload = async (doc: Document) => {
    try {
      const {encryptedKey, iv} = await getKey(address as string, doc.documentCid)
      const encryptedSymmetricKey = encryptedKey
      console.log(encryptedKey, iv)
  
      // 1. Fetch encrypted file from IPFS
      const ipfsUrl = `${import.meta.env.VITE_IPFS_GATEWAY_URL}/ipfs/${doc.documentCid}`;
      const response = await fetch(ipfsUrl);
      if (!response.ok) throw new Error("Failed to fetch file from IPFS");

      const encryptedKeyFromDB = await getKeyFromDB(address as string)

      const encKeyUint8Array = base64ToUint8Array(encryptedKeyFromDB as string);

      const decryptedResult = await tryDecryptAndParseJSON(encKeyUint8Array, "buls2012");

      const privateKey = await importPrivateKeyFromJWK(decryptedResult.parsed);
      
      const symmetricKey = await decryptData(privateKey, base64ToUint8Array(encryptedSymmetricKey));
  
      const encryptedArrayBuffer = await response.arrayBuffer();
      const encryptedWordArray = enc.Hex.parse(Buffer.from(encryptedArrayBuffer).toString("hex"));
  
      const key = enc.Hex.parse(symmetricKey);
      const ivBuf = enc.Hex.parse(iv);
  
      const cipherParams = lib.CipherParams.create({
        ciphertext: encryptedWordArray
      });
  
      const decrypted = AES.decrypt(cipherParams, key, {
        iv: ivBuf,
        mode: mode.CBC,
        padding: pad.Pkcs7
      });
  
      const decryptedHex = decrypted.toString(enc.Hex);
      const decryptedBytes = Buffer.from(decryptedHex, "hex");
  
      const blob = new Blob([decryptedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to decrypt and open document.");
    }
  };

  const handleAddParticipant = async () => {
    try {
      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }
      await addParticipant(tenderId, participantAddress, participant?.name || "", participant?.email || "");
      toast.success("Participant added successfully");
      setIsPending(false);
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant");
    }
  };

  const renderDocuments = (docs: Document[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {docs.length === 0 ? (
        <div className="col-span-2 text-center py-8 text-muted-foreground">
          No documents have been uploaded
        </div>
      ) : (
        docs.map((doc) => (
          <div key={doc.documentCid} className="border rounded-lg overflow-hidden hover:border-primary transition-colors">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                {getFileIcon(doc.documentName.split('.').pop() || '')}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate">{doc.documentName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded at {formatDate(doc.submissionDate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => handleDownload(doc)}>Download</Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <Link
          to={`/tenders/${tenderId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tender
        </Link>
      </div>

      <div className="space-y-6">
        {/* Participant Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Participant's Submissions</CardTitle>
              {isPending && (
                <Button onClick={handleAddParticipant}>
                  Add to Tender
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Profile</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="ml-2 font-mono" title={participantAddress}>
                      {participantAddress}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2">{participant?.name}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground w-16">Email:</span>
                    <span>{participant?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPending ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Registration Documents</h2>
            {renderDocuments(documents.registrationDocuments)}
          </div>
        ) : (
          <Tabs defaultValue="tender" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="tender" className="flex-1">Tender Documents</TabsTrigger>
              <TabsTrigger value="registration" className="flex-1">Registration Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="registration" className="space-y-6 mt-6">
              {renderDocuments(documents.registrationDocuments)}
            </TabsContent>
            <TabsContent value="tender" className="space-y-6 mt-6">
              {renderDocuments(documents.tenderDocuments)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
