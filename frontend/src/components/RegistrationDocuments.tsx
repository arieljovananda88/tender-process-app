"use client"
import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Upload, X, Plus } from "lucide-react"

interface Document {
  id: string
  name: string
  size: number
  uploadDate: number
  url: string
}

interface RegistrationDocumentsProps {
  documents: Document[]
  isRegistered: boolean
  isActive: boolean
}

export function RegistrationDocuments({ documents, isRegistered, isActive }: RegistrationDocumentsProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>(documents)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format the timestamps to readable dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (selectedFile) {
      // In a real app, you would upload the file to a server here
      const newDocument: Document = {
        id: `new-${Date.now()}`,
        name: selectedFile.name,
        size: selectedFile.size / (1024 * 1024), // Convert to MB
        uploadDate: Math.floor(Date.now() / 1000),
        url: URL.createObjectURL(selectedFile),
      }

      setUploadedDocuments([...uploadedDocuments, newDocument])
      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {isRegistered && isActive && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Upload New Document</h3>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Add File
              </Button>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
            </div>

            {selectedFile && (
              <div className="border rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                  <Button size="sm" onClick={handleUpload} className="h-8">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-sm font-medium mb-2">Your Documents</h3>

          {uploadedDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No documents uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.size.toFixed(2)} MB • Uploaded {formatDate(doc.uploadDate)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
