"use client"
import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Upload, X, Plus, File, FileImage, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useAccount } from "wagmi"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AES, enc, lib, mode, pad } from "crypto-js";
import { Buffer } from "buffer"

// Polyfill Buffer for browser environment
window.Buffer = Buffer;

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ethers } from "ethers"

type Document = {
  documentCid: string;
  documentName: string;
  documentType: string;
  submissionDate: bigint; // `ethers.js` returns BigNumber or bigint
};

interface DocumentListProps {
  documents: Document[]
  isRegistered?: boolean
  isActive?: boolean
  typeOfFile: "Tender" | "Registration"
  allowedFileTypes?: string[]
  iconSize?: number
  textSize?: "sm" | "base" | "lg"
  canUpload?: boolean
}

export function DocumentList({ 
  documents, 
  isActive = true, 
  typeOfFile = "Tender",
  allowedFileTypes = ["pdf", "docx", "png", "jpg"],
  iconSize = 10,
  textSize = "base",
  canUpload = true,
}: DocumentListProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { address } = useAccount()
  const { id: tenderId } = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FileText className={`h-${iconSize} w-${iconSize} text-red-500`} />
      case "doc":
      case "docx":
        return <File className={`h-${iconSize} w-${iconSize} text-blue-500`} />
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

  const handleDownload = async (doc: Document) => {
    try {
      const symmetricKeyHex = "5e9277da37d9dbb4dac7c436e250ee75333b61969b66027085f8c2f699da7fc5";
      const ivHex = "8d1e651b73db4411c9160f1dca632411";
  
      // 1. Fetch encrypted file from IPFS
      const ipfsUrl = `${import.meta.env.VITE_IPFS_GATEWAY_URL}/ipfs/${doc.documentCid}`;
      const response = await fetch(ipfsUrl);
      if (!response.ok) throw new Error("Failed to fetch file from IPFS");
  
      const encryptedArrayBuffer = await response.arrayBuffer();
      const encryptedWordArray = enc.Hex.parse(Buffer.from(encryptedArrayBuffer).toString("hex"));
  
      // 2. Prepare key and IV
      const key = enc.Hex.parse(symmetricKeyHex);
      const iv = enc.Hex.parse(ivHex);
  
      const cipherParams = lib.CipherParams.create({
        ciphertext: encryptedWordArray
      });
  
      // 4. Decrypt
      const decrypted = AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: mode.CBC,
        padding: pad.Pkcs7
      });
  
      // 5. Convert decrypted WordArray to binary
      const decryptedHex = decrypted.toString(enc.Hex);
      const decryptedBytes = Buffer.from(decryptedHex, "hex");
  
      // 6. Download blob (assuming PDF)
      const blob = new Blob([decryptedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to decrypt and open document.");
    }
  };
  

  const handleUpload = async () => {
    if (!selectedFile || !fileName) {
      toast.error("Please fill in all fields and select a file before uploading.")
      return
    }

    if(!address) {
      toast.error("Please connect your wallet to upload documents.")
      return
    }

    if(!tenderId) {
      toast.error("Tender ID not found.")
      return
    }
    setIsUploadModalOpen(false)
    setIsUploading(true)
    const formData = new FormData()
    formData.append("document", selectedFile)
    formData.append("documentName", fileName)
    formData.append("documentType", typeOfFile)
    formData.append("tenderId", tenderId)
    formData.append("participantName", JSON.parse(localStorage.getItem('user') || '{}').name || '')
    formData.append("participantEmail", JSON.parse(localStorage.getItem('user') || '{}').email || '')
  
    try {
      // Generate signature
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

      // Create message hash for deadline
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "string", "uint256"],
          [tenderId, fileName, deadline]
        )
      )

      // Sign the hash
      const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
      const splitSig = ethers.utils.splitSignature(signature)

      // Add signature to formData
      formData.append("deadline", deadline.toString())
      formData.append("v", splitSig.v.toString())
      formData.append("r", splitSig.r)
      formData.append("s", splitSig.s)
      formData.append("signer", address)

      // Upload document with signature
      const uploadResponse = await fetch("http://localhost:9090/upload-document", {
        method: "POST",
        body: formData,
      })
  
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`)
      }
  
      const uploadResult = await uploadResponse.json()

      console.log(uploadResult)

      // Reset UI
      setSelectedFile(null)
      setFileName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      toast.success("Upload file was successful!")
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload document. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }
  

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          {/* <h2 className="text-lg font-semibold">Your {typeOfFile} Documents</h2> */}
          {canUpload && isActive && (
            <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)} className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Add File
            </Button>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No documents uploaded yet
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.documentName} className={`overflow-hidden transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getFileIcon(doc.documentName)}
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-medium text-${textSize} truncate`}>{doc.documentName}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded at {formatDate(doc.submissionDate.toString())}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        size="sm" 
                        onClick={() => handleDownload(doc)} 
                        className="h-8 w-8 p-0"
                      >
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
              <Label>File</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={allowedFileTypes.map(type => `.${type}`).join(",")}
                />
              </div>
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
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !fileName || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Uploading document...</p>
          </div>
        </div>
      )}
    </Card>
  )
} 