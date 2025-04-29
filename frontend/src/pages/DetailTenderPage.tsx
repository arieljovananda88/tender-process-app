"use client"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Clock, ArrowLeft } from "lucide-react"
import { ParticipantsList } from "@/components/ParticipantsList"
import { RegistrationDocuments } from "@/components/RegistrationDocuments"
import { TenderDocuments } from "@/components/TenderDocuments"
import { getTenderById, type Tender } from "@/lib/api"
import { formatDate, shortenAddress, calculateTimeRemaining } from "@/lib/utils"
import { useAccount } from "wagmi"
// Mock data for participants, tender documents, and registration documents
const mockData = {
  isRegistered: true,
  participants: [
    {
      address: "0xA123456789012345678901234567890123456789",
      name: "Tech Solutions Inc.",
      applicationDate: Math.floor(Date.now() / 1000) - 86400 * 5,
      documentUrl: "/documents/application1.pdf",
    },
    {
      address: "0xB234567890123456789012345678901234567890",
      name: "Network Systems Ltd.",
      applicationDate: Math.floor(Date.now() / 1000) - 86400 * 3,
      documentUrl: "/documents/application2.pdf",
    },
    {
      address: "0xC345678901234567890123456789012345678901",
      name: "Digital Infrastructure Co.",
      applicationDate: Math.floor(Date.now() / 1000) - 86400 * 1,
      documentUrl: "/documents/application3.pdf",
    },
  ],
  tenderDocuments: [
    {
      id: "1",
      name: "Technical Requirements.pdf",
      size: 2.4,
      uploadDate: Math.floor(Date.now() / 1000) - 86400 * 7,
      url: "/documents/technical-requirements.pdf",
    },
    {
      id: "2",
      name: "Financial Terms.docx",
      size: 1.2,
      uploadDate: Math.floor(Date.now() / 1000) - 86400 * 7,
      url: "/documents/financial-terms.docx",
    },
    {
      id: "3",
      name: "Contract Template.pdf",
      size: 3.5,
      uploadDate: Math.floor(Date.now() / 1000) - 86400 * 6,
      url: "/documents/contract-template.pdf",
    },
    {
      id: "4",
      name: "Compliance Requirements.pdf",
      size: 1.8,
      uploadDate: Math.floor(Date.now() / 1000) - 86400 * 5,
      url: "/documents/compliance-requirements.pdf",
    },
  ],
  registrationDocuments: [
    {
      id: "1",
      name: "Company Registration.pdf",
      size: 1.5,
      uploadDate: Math.floor(Date.now() / 1000) - 86400 * 2,
      url: "/documents/company-registration.pdf",
    },
    {
      id: "2",
      name: "Tax Clearance Certificate.pdf",
      size: 0.8,
      uploadDate: Math.floor(Date.now() / 1000) - 86400 * 2,
      url: "/documents/tax-clearance.pdf",
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
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <Link
          to="/tenders/search"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tenders
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on desktop */}
        <div className="md:col-span-2 space-y-6">
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

          {/* Tender Documents - Emphasized */}
          {!isOwner && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-4">Your Tender Documents</h2>
              <TenderDocuments documents={mockData.tenderDocuments} />
            </div>
          )}

          {/* Participants section */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Participants</h2>
            <ParticipantsList isOwner={isOwner} participants={mockData.participants} winnerId={tender.winner} />
          </div>
        </div>

        {/* Sidebar - 1/3 width on desktop */}
        <div className="space-y-6">
          {/* Application status card - simplified */}
          {!isOwner && (
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
          )}

          {/* Registration Documents */}
          {!isOwner && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Registration Documents</h2>
              <RegistrationDocuments
                documents={mockData.registrationDocuments}
                isRegistered={mockData.isRegistered}
                isActive={tender.isActive}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
