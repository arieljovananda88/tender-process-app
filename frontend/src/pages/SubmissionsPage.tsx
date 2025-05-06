"use client"

import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Building, FileText, File, FileImage, FileSpreadsheet } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDate } from "@/lib/utils"
import { useDocumentStore } from "@/hooks/useContracts"
import { useEffect, useState } from "react"

type Document = {
  documentCid: string;
  documentName: string;
  documentType: string;
  submissionDate: bigint;
};

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
  // const navigate = useNavigate()
  // const { address } = useAccount()
  const tenderId = params.id as string
  const participantAddress = params.address as string
  const { fetchParticipantDocuments } = useDocumentStore()
  const [documents, setDocuments] = useState<{ registrationDocuments: Document[], tenderDocuments: Document[] }>({
    registrationDocuments: [],
    tenderDocuments: []
  });

  useEffect(() => {
    const loadDocuments = async () => {
      if (tenderId && participantAddress) {
        const docs = await fetchParticipantDocuments(tenderId, participantAddress);
        if (docs) {
          setDocuments(docs);
        }
      }
    };
    loadDocuments();
  }, [tenderId, participantAddress, fetchParticipantDocuments]);

  const handleDownload = (doc: Document) => {
    const ipfsUrl = `${import.meta.env.VITE_IPFS_GATEWAY_URL}/ipfs/${doc.documentCid}`;
    window.open(ipfsUrl, '_blank');
  };

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
            <CardTitle className="text-xl">Participant's Submissions</CardTitle>
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
                    <span className="ml-2">dummy name</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground w-16">Email:</span>
                    <span>dummy email</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground w-16">Phone:</span>
                    <span>dummy phone</span>
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
              {documents.tenderDocuments.map((doc) => (
                <Card key={doc.documentCid} className="overflow-hidden hover:border-primary transition-colors">
                  <CardContent className="p-0">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="registration" className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Registration Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.registrationDocuments.map((doc) => (
                <Card key={doc.documentCid} className="overflow-hidden hover:border-primary transition-colors">
                  <CardContent className="p-0">
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
