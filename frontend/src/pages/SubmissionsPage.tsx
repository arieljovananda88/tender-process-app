"use client"

import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, User, Building, FileText, File, FileImage, FileSpreadsheet } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDate, shortenAddress } from "@/lib/utils"

// Mock data for a participant's submissions
const getParticipantSubmissions = (tenderId: string, address: string) => {
  return {
    participant: {
      address: address,
      name: "Tech Solutions Inc.",
      applicationDate: "2023-05-15T10:30:00Z",
      company: "Tech Solutions Incorporated",
      email: "contact@techsolutions.com",
      phone: "+1 (555) 123-4567",
    },
    tender: {
      id: tenderId,
      name: "IT Infrastructure Upgrade for Government Offices",
    },
    registrationDocuments: [
      {
        id: "reg1",
        name: "Company Registration Certificate.pdf",
        size: 1.2, // MB
        uploadDate: "2023-05-10T09:15:00Z",
        url: "/documents/company-registration.pdf",
        type: "pdf",
      },
      {
        id: "reg2",
        name: "Tax Clearance Certificate.pdf",
        size: 0.8, // MB
        uploadDate: "2023-05-10T09:16:00Z",
        url: "/documents/tax-clearance.pdf",
        type: "pdf",
      },
      {
        id: "reg3",
        name: "Business License.pdf",
        size: 1.5, // MB
        uploadDate: "2023-05-10T09:17:00Z",
        url: "/documents/business-license.pdf",
        type: "pdf",
      },
    ],
    tenderDocuments: [
      {
        id: "ten1",
        name: "Technical Proposal.pdf",
        size: 3.5, // MB
        uploadDate: "2023-05-15T10:25:00Z",
        url: "/documents/technical-proposal.pdf",
        type: "pdf",
      },
      {
        id: "ten2",
        name: "Financial Proposal.xlsx",
        size: 1.8, // MB
        uploadDate: "2023-05-15T10:26:00Z",
        url: "/documents/financial-proposal.xlsx",
        type: "xlsx",
      },
      {
        id: "ten3",
        name: "Implementation Timeline.docx",
        size: 2.2, // MB
        uploadDate: "2023-05-15T10:27:00Z",
        url: "/documents/implementation-timeline.docx",
        type: "docx",
      },
      {
        id: "ten4",
        name: "Team Credentials.pdf",
        size: 4.1, // MB
        uploadDate: "2023-05-15T10:28:00Z",
        url: "/documents/team-credentials.pdf",
        type: "pdf",
      },
      {
        id: "ten5",
        name: "Previous Projects.jpg",
        size: 2.7, // MB
        uploadDate: "2023-05-15T10:29:00Z",
        url: "/documents/previous-projects.jpg",
        type: "jpg",
      },
    ],
  }
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
  const navigate = useNavigate()
  const tenderId = params.id as string
  const participantAddress = params.address as string

  const { participant, tender, registrationDocuments, tenderDocuments } = getParticipantSubmissions(
    tenderId,
    participantAddress,
  )

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
            <CardTitle className="text-xl">Participant Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">{participant.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="ml-2 font-mono" title={participant.address}>
                      {shortenAddress(participant.address)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Company:</span>
                    <span className="ml-2">{participant.company}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="ml-2">{formatDate(participant.applicationDate)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground w-16">Email:</span>
                    <span>{participant.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground w-16">Phone:</span>
                    <span>{participant.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Tabs */}
        <Tabs defaultValue="tender" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tender">Tender Documents</TabsTrigger>
            <TabsTrigger value="registration">Registration Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="tender" className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Tender Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenderDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden hover:border-primary transition-colors">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        {getFileIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base truncate">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {doc.size.toFixed(2)} MB • Uploaded {formatDate(doc.uploadDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button size="sm">Download</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="registration" className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Registration Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrationDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden hover:border-primary transition-colors">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        {getFileIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base truncate">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {doc.size.toFixed(2)} MB • Uploaded {formatDate(doc.uploadDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button size="sm">Download</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
