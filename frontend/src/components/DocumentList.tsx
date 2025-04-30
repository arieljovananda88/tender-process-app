"use client"
import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Upload, X, Plus, File, FileImage, FileSpreadsheet } from "lucide-react"
import { formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Document {
  id: string
  name: string
  size: number
  uploadDate: string
  url: string
  type: string
}

interface DocumentListProps {
  documents: Document[]
  isRegistered?: boolean
  isActive?: boolean
  typeOfFile: "Tender" | "Registration"
  allowedFileTypes?: string[]
  onUpload?: (file: File, name: string, type: string) => Promise<void>
  onDownload?: (document: Document) => void
  iconSize?: number
  textSize?: "sm" | "base" | "lg"
}

export function DocumentList({ 
  documents, 
  isRegistered = true, 
  isActive = true, 
  typeOfFile = "Tender",
  allowedFileTypes = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
  onUpload,
  onDownload,
  iconSize = 10,
  textSize = "base"
}: DocumentListProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileType, setFileType] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FileText className={`h-${iconSize} w-${iconSize} text-red-500`} />
      case "doc":
      case "docx":
        return <File className={`h-${iconSize} w-${iconSize} text-blue-500`} />
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className={`h-${iconSize} w-${iconSize} text-green-500`} />
      case "jpg":
      case "jpeg":
      case "png":
        return <FileImage className={`h-${iconSize} w-${iconSize} text-purple-500`} />
      default:
        return <File className={`h-${iconSize} w-${iconSize} text-gray-500`} />
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setSelectedFile(file)
      setFileName(file.name.split(".")[0]) // Set initial name without extension
      setIsUploadModalOpen(true)
    }
  }

  const handleUpload = async () => {
    if (selectedFile && fileName && fileType && onUpload) {
      try {
        await onUpload(selectedFile, fileName, fileType)
        setSelectedFile(null)
        setFileName("")
        setFileType("")
        setIsUploadModalOpen(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        console.error("Error uploading file:", error)
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          {/* <h2 className="text-lg font-semibold">Your {typeOfFile} Documents</h2> */}
          {isRegistered && isActive && (
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Add File
            </Button>
          )}
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={allowedFileTypes.map(type => `.${type}`).join(",")}
          />
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No documents uploaded yet</p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="overflow-hidden hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getFileIcon(doc.name)}
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-medium text-${textSize} truncate`}>{doc.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.size.toFixed(2)} MB • Uploaded {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button size="sm" onClick={() => onDownload?.(doc)} className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New {typeOfFile} Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">Document Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileType">Document Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {allowedFileTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedFile && (
              <div className="border rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center">
                  {getFileIcon(selectedFile.name)}
                  <div className="ml-2">
                    <p className="text-sm font-medium truncate max-w-[180px]">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !fileName || !fileType}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 