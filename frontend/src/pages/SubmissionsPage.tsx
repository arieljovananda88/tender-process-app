"use client"

import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, FileText, File, FileImage, FileSpreadsheet, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { downloadEncryptedFileWithDialog, formatDate } from "@/lib/utils"
import { useDocumentStore, useTenderManager } from "@/hooks/useContracts"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { toast } from "react-toastify"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTenderById, getUser, requestAccess, selectWinner, Tender } from "@/lib/api"
import { Document } from "@/lib/types"
import { ethers } from "ethers"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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
  const [chooseWinner, setChooseWinner] = useState(false)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const tenderId = params.id as string
  const participantAddress = params.address as string
  const { fetchParticipantDocuments } = useDocumentStore()
  const { isPendingParticipant, addParticipant, isParticipant, getWinner } = useTenderManager()
  const [isPending, setIsPending] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [tender, setTender] = useState<Tender | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<{ registrationDocuments: Document[], tenderDocuments: Document[] }>({
    registrationDocuments: [],
    tenderDocuments: []
  });
  const [isAddingParticipant, setIsAddingParticipant] = useState(false)
  const [isChoosingWinner, setIsChoosingWinner] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [failedDocument, setFailedDocument] = useState<Document | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (tenderId && participantAddress) {
        const docs = await fetchParticipantDocuments(tenderId, participantAddress);
        if (docs) {
          setDocuments(docs);
        }
        const pending = await isPendingParticipant(tenderId, participantAddress);
        const registered = await isParticipant(tenderId, participantAddress);
        const winnerAddress = await getWinner(tenderId);
        setIsWinner(winnerAddress.toLowerCase() === participantAddress.toLowerCase())
        const participant = await getUser(participantAddress);
        setParticipant({
          address: participantAddress,
          name: participant.name,
          email: participant.email
        });
        setIsPending(pending); 
        setIsRegistered(registered);
        // Fetch tender details
        const tenderData = await getTenderById(tenderId);
        setTender(tenderData);
      }
    };
    const fetchTender = async () => {
      try {
        const tender = await getTenderById(tenderId as string)
        setTender(tender)
      } catch (err) {
        setError("Failed to fetch tender")
      }
    }
    fetchTender()
    loadData();
  }, []);

  useEffect(() => {
    if (tender &&
      isRegistered &&
      address?.toLowerCase() === tender.owner?.toLowerCase() &&
      !isWinner) {
      setChooseWinner(true)
    } else {
      setChooseWinner(false)
    }
  }, [tender, isRegistered, address, isWinner])


  const handleDownload = async (doc: Document) => {
    const success = await downloadEncryptedFileWithDialog(address as string, doc)
    if (!success) {
      setFailedDocument(doc)
      setShowAccessModal(true)
    }
  };

  const handleRequestAccess = async (doc: Document) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const messageHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["uint256"],
        [deadline]
      )
    )
    const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
    const splitSig = ethers.utils.splitSignature(signature)
    
    const response = await requestAccess(participantAddress, tenderId, doc.documentCid, doc.documentName, doc.documentFormat, deadline, splitSig.v, splitSig.r, splitSig.s)

    if (response.success) {
      toast.success('Access request sent!')
    } else {
      toast.error('Failed to send access request')
    }
    setShowAccessModal(false)
    setFailedDocument(null)
  };

  const handleAddParticipant = async () => {
    try {
      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }
      setIsAddingParticipant(true);
      await addParticipant(tenderId, participantAddress, participant?.name || "", participant?.email || "");
      toast.success("Participant added successfully");
      setIsPending(false);
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant");
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleChooseWinner = async () => {
    try {
      setIsChoosingWinner(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

      // Create message hash for deadline
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "uint256"],
          [tenderId, deadline]
        )
      )

      // Sign the hash
      const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
      const splitSig = ethers.utils.splitSignature(signature)

      const response = await selectWinner(tenderId, participantAddress, "Participant chosen as winner", deadline, splitSig.v, splitSig.r, splitSig.s);
      if (response.success) {
        toast.success('Participant chosen as winner!');
        setIsWinner(true);
        setChooseWinner(false);
      } else {
        toast.error('Failed to choose participant as winner');
      }
    } catch (error) {
      console.error("Error choosing winner:", error);
      toast.error('Failed to choose participant as winner');
    } finally {
      setIsChoosingWinner(false);
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
                  <p className="text-xs text-muted-foreground mt-1">
                    CID: {doc.documentCid}
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
              <div className="flex gap-2">
                {isPending && (
                  <Button onClick={handleAddParticipant} disabled={isAddingParticipant}>
                    {isAddingParticipant ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add to Tender'
                    )}
                  </Button>
                )}
                {/* Choose as Winner button logic */}
                {chooseWinner && (
                  <Button onClick={handleChooseWinner} disabled={isChoosingWinner}>
                    {isChoosingWinner ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Choosing...
                      </>
                    ) : (
                      'Choose as Winner'
                    )}
                  </Button>
                )}
              </div>
              {error && (
                <div className="text-red-500">{error}</div>
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

        {/* Loading Modal for Add Participant */}
        {isAddingParticipant && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Adding participant...</p>
            </div>
          </div>
        )}

        {/* Loading Modal for Choose Winner */}
        {isChoosingWinner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Choosing winner...</p>
            </div>
          </div>
        )}

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

      {/* Request Access Modal */}
      <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Required</DialogTitle>
            <DialogDescription>
              You don't have permission to download this document. Would you like to request access from the owner?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {failedDocument && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Document: {failedDocument.documentName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded on {formatDate(failedDocument.submissionDate)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleRequestAccess(failedDocument as Document)}>
              Request Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
