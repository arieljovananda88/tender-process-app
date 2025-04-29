"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, File, FileImage, FileSpreadsheet } from "lucide-react"

interface Document {
  id: string
  name: string
  size: number
  uploadDate: number
  url: string
}

interface TenderDocumentsProps {
  documents: Document[]
}

export function TenderDocuments({ documents }: TenderDocumentsProps) {
  // Format the timestamps to readable dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get file icon based on extension
  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()

    switch (extension) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="overflow-hidden hover:border-primary transition-colors">
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                {getFileIcon(doc.name)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate">{doc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.size.toFixed(2)} MB • Uploaded {formatDate(doc.uploadDate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
