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
import { useAccount } from "wagmi"

interface Document {
  id: string
  name: string
  size: number
  uploadDate: string
  url: string
  type: string
}

// Mock data for participants, tender documents, and registration documents
const mockData = {
  isRegistered: true,
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
  tenderDocuments: [
    {
      id: "1",
      name: "Technical Requirements.pdf",
      size: 2.4,
      uploadDate: new Date().toISOString(),
      url: "/documents/technical-requirements.pdf",
      type: "pdf"
    },
    {
      id: "2",
      name: "Financial Terms.docx",
      size: 1.2,
      uploadDate: new Date().toISOString(),
      url: "/documents/financial-terms.docx",
      type: "docx"
    },
    {
      id: "3",
      name: "Contract Template.pdf",
      size: 3.5,
      uploadDate: new Date().toISOString(),
      url: "/documents/contract-template.pdf",
      type: "pdf"
    },
    {
      id: "4",
      name: "Compliance Requirements.pdf",
      size: 1.8,
      uploadDate: new Date().toISOString(),
      url: "/documents/compliance-requirements.pdf",
      type: "pdf"
    },
  ],
  registrationDocuments: [
    {
      id: "1",
      name: "Company Registration.pdf",
      size: 1.5,
      uploadDate: new Date().toISOString(),
      url: "/documents/company-registration.pdf",
      type: "pdf"
    },
    {
      id: "2",
      name: "Tax Clearance Certificate.pdf",
      size: 0.8,
      uploadDate: new Date().toISOString(),
      url: "/documents/tax-clearance.pdf",
      type: "pdf"
    },
  ],
}

export default function TenderDetailPage() {
  const { id } = useParams()
  const { address } = useAccount();
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleUploadTenderDocument = async (file: File, name: string, type: string) => {
    // TODO: Implement tender document upload
    console.log("Uploading tender document:", { file, name, type })
  }

  const handleUploadRegistrationDocument = async (file: File, name: string, type: string) => {
    // TODO: Implement registration document upload
    console.log("Uploading registration document:", { file, name, type })
  }

  const handleDownloadDocument = (document: Document) => {
    // TODO: Implement document download
    console.log("Downloading document:", document)
  }

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

          {/* Tender Documents - Emphasized */}
          {!isOwner && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Tender Documents</h2>
              <DocumentList
                documents={mockData.tenderDocuments}
                isRegistered={mockData.isRegistered}
                isActive={tender.isActive}
                typeOfFile="Tender"
                onUpload={handleUploadTenderDocument}
                onDownload={handleDownloadDocument}
                iconSize={10}
                textSize="base"
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
                    {mockData.isRegistered ? (
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

            {/* Registration Documents */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">Registration Documents</h2>
              <DocumentList
                typeOfFile="Registration"
                documents={mockData.registrationDocuments}
                isRegistered={mockData.isRegistered}
                isActive={tender.isActive}
                onUpload={handleUploadRegistrationDocument}
                onDownload={handleDownloadDocument}
                iconSize={8}
                textSize="sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
