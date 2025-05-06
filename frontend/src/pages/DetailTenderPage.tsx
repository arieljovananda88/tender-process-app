"use client"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Clock, ArrowLeft } from "lucide-react"
import { ParticipantsList } from "@/components/ParticipantsList"
import { DocumentList } from "@/components/DocumentList"
import { getTenderById, type Tender } from "@/lib/api"
import { formatDate, shortenAddress, calculateTimeRemaining } from "@/lib/utils"
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import DocumentStoreArtifact from "../../../backend/artifacts/contracts/DocumentStore.sol/DocumentStore.json";
import TenderManagerArtifact from "../../../backend/artifacts/contracts/TenderManager.sol/TenderManager.json";

type Document = {
  documentCid: string;
  documentName: string;
  documentType: string;
  submissionDate: bigint; // `ethers.js` returns BigNumber or bigint
};

// Mock data for participants, tender documents, and registration documents
const mockData = {
  participants: [
    {
      address: "0xA123456789012345678901234567890123456789",
      name: "Tech Solutions Inc.",
      applicationDate: new Date().toISOString(),
      documentUrl: "/documents/application1.pdf",
    },
    {
      address: "0xB234567890123456789012345678901234567890",
      name: "Network Systems Ltd.",
      applicationDate: new Date().toISOString(),
      documentUrl: "/documents/application2.pdf",
    },
    {
      address: "0xC345678901234567890123456789012345678901",
      name: "Digital Infrastructure Co.",
      applicationDate: new Date().toISOString(),
      documentUrl: "/documents/application3.pdf",
    },
  ],
}

function useIsApproved(tenderId: string) {
  const { address, isConnected } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  useEffect(() => {
    const fetchRegStatus = async () => {
      if (!address || !isConnected) {
        alert("Please connect your wallet first.");
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tenderManagerAddress = "0x772162014301545ef4E8DB2678cb8da7af90c94c";
        const contract = new ethers.Contract(tenderManagerAddress, TenderManagerArtifact.abi, signer);

        const resPending = await contract.isPendingParticipant(tenderId, address);
        const resRegistered = await contract.isParticipant(tenderId, address);
        setIsPending(resPending)
        setIsRegistered(resRegistered)
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchRegStatus();
  }, [address, isConnected, tenderId]);
  return { isPending, isRegistered };
}

function useMyDocuments(tenderId: string) {
  const [documents, setDocuments] = useState<{ registrationDocuments: Document[], tenderDocuments: Document[] }>({ registrationDocuments: [], tenderDocuments: [] });
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!address || !isConnected) {
        alert("Please connect your wallet first.");
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const documentStoreAddress = "0x6b65292637d39C336FbB56e3C7a77B3df27F0F15";
        const contract = new ethers.Contract(documentStoreAddress, DocumentStoreArtifact.abi, signer);

        const docs = await contract.getMyDocuments(tenderId);
        const registrationDocs = docs.filter((doc: Document) => doc.documentType === "Registration");
        const tenderDocs = docs.filter((doc: Document) => doc.documentType !== "Registration");
        setDocuments({ registrationDocuments: registrationDocs, tenderDocuments: tenderDocs });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocuments();
  }, [address, isConnected, tenderId]);
  return documents;
}

export default function TenderDetailPage() {
  const { id } = useParams()
  const { address } = useAccount();
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { registrationDocuments, tenderDocuments } = useMyDocuments(id as string);
  const { isPending, isRegistered } = useIsApproved(id as string);

  const isOwner = address?.toLowerCase() === tender?.owner.toLowerCase()

  useEffect(() => {
    const fetchTender = async () => {
      try {
        const response = await getTenderById(id as string)
        setTender(response.tender)
      } catch (err) {
        setError("Failed to fetch tender")
      } finally {
        setLoading(false)
      }
    }
    fetchTender()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error || !tender) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="text-center text-red-500">{error || "Tender not found"}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-[1920px]">
      <div className="mb-6">
        <Link
          to="/tenders/search"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tenders
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left sidebar - Participants (only for non-owners) */}
        {!isOwner && (
          <div className="xl:col-span-3 space-y-6">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Participants</h2>
              <ParticipantsList
                participants={mockData.participants}
                winnerId={tender.winner}
                isOwner={isOwner}
                tenderId={id as string}
              />
            </div>
          </div>
        )}

        {/* Main content - center */}
        <div className={`space-y-6 ${isOwner ? 'xl:col-span-12' : 'xl:col-span-6'}`}>
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{tender.name}</h1>
            <Badge className={tender.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {tender.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-1 h-4 w-4" />
            <span title={tender.owner}>Owner: {isOwner ? "You" : shortenAddress(tender.owner)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Start: {formatDate(tender.startDate)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="mr-1 h-4 w-4" />
              <span>End: {formatDate(tender.endDate)}</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-amber-600">
            <Clock className="mr-1 h-4 w-4" />
            <span>{calculateTimeRemaining(tender.endDate)}</span>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{tender.description}</p>
          </div>

          {/* Participants (only for owners) */}
          {isOwner && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Participants</h2>
              <ParticipantsList
                participants={mockData.participants}
                winnerId={tender.winner}
                isOwner={isOwner}
                tenderId={id as string}
              />
            </div>
          )}

          {/* Documents Section - Changes based on registration status */}
          {!isOwner && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">
                {isRegistered ? "Tender Documents" : "Registration Documents"}
              </h2>
              <DocumentList
                documents={isRegistered ? tenderDocuments : registrationDocuments}
                isRegistered={isRegistered}
                isActive={tender.isActive}
                typeOfFile={isRegistered ? "Tender" : "Registration"}
                iconSize={10}
                textSize="base"
                canUpload={true}
              />
            </div>
          )}
        </div>

        {/* Right sidebar - Application status and Registration Documents */}
        {!isOwner && (
          <div className="xl:col-span-3 space-y-6">
            {/* Application status card - simplified */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-3">Application Status</h2>
                {tender.isActive ? (
                  <>
                    {isPending ? (
                      <div className="bg-amber-50 text-amber-800 p-3 rounded-md">
                        <p className="font-medium">Waiting for Approval</p>
                        <p className="text-sm mt-1">
                          Your registration is pending approval from the tender owner.
                        </p>
                      </div>
                    ) : isRegistered ? (
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-md">
                        <p className="font-medium">Registered</p>
                        <p className="text-sm mt-1">
                          You are registered for this tender. You can upload your documents below.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-800 p-3 rounded-md">
                        <p className="font-medium">Not Registered</p>
                        <p className="text-sm mt-1">
                          You are not registered for this tender. Please contact the tender owner to register.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-red-50 text-red-800 p-3 rounded-md">
                    <p className="font-medium">Closed</p>
                    <p className="text-sm mt-1">This tender is no longer active.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration Documents - Only show when registered */}
            {isRegistered && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-2">Registration Documents</h2>
                <DocumentList
                  typeOfFile="Registration"
                  documents={registrationDocuments}
                  isRegistered={isRegistered}
                  isActive={tender.isActive}
                  iconSize={8}
                  textSize="sm"
                  canUpload={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
