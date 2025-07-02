import React, { useEffect, useState } from "react"
import { SearchHeader } from "@/components/SearchHeader"
import { getAccessRequests, getAccessRequestsLength, getAccessRequestsToMe, getAccessRequestsToMeLength, getKey, type AccessRequest } from "@/lib/api"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, User, Calendar, Download } from "lucide-react"
import { decryptSymmetricKey, encryptSymmetricKeyWithPublicKey, formatDate, shortenAddress, downloadEncryptedFileWithDialog } from "@/lib/utils"
import { useAccount } from "wagmi"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import { grantAccess } from "@/lib/api"
import PublicKeyStorageArtifact from "../../../backend/artifacts/contracts/PublicKeyStorage.sol/PublicKeyStorage.json"

const ITEMS_PER_PAGE = 12

export default function AccessRequestsPage() {
  const { address } = useAccount()
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([])
  const [requestsToMe, setRequestsToMe] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("to-me")

  const handleSearch = (query: string) => {
    const fetchData = async () => {
      try {
        setLoading(true)
        if (activeTab === "to-me") {
          const requests = await getAccessRequestsToMe(query, 0, ITEMS_PER_PAGE, address as string)
          const length = await getAccessRequestsToMeLength(query, address as string)
          if (requests) {
            setRequestsToMe(requests)
            setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
            setCurrentPage(1)
          }
        } else {
          const requests = await getAccessRequests(query, 0, ITEMS_PER_PAGE, address as string)
          const length = await getAccessRequestsLength(query, address as string)
          if (requests) {
            setMyRequests(requests)
            setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
            setCurrentPage(1)
          }
        }
      } catch (err) {
        setError("An error occurred while fetching access requests")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }

  // Fetch data for current page
  const fetchPageData = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      
      if (activeTab === "to-me") {
        const requestsToMeData = await getAccessRequestsToMe("", offset, ITEMS_PER_PAGE, address as string)
        const length = await getAccessRequestsToMeLength("", address as string)
        if (requestsToMeData) {
          setRequestsToMe(requestsToMeData)
          setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
        }
      } else {
        const myRequestsData = await getAccessRequests("", offset, ITEMS_PER_PAGE, address as string)
        const length = await getAccessRequestsLength("", address as string)
        if (myRequestsData) {
          setMyRequests(myRequestsData)
          setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
        }
      }
    } catch (err) {
      setError("An error occurred while fetching access requests")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch page data when page changes
  useEffect(() => {
    if (address) {
      fetchPageData()
    }
  }, [address, currentPage, activeTab])

  const getVisiblePages = () => {
    const pages = []
    if (totalPages <= 1) {
      pages.push(1)
    } else if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      
      if (currentPage > 2) {
        pages.push(currentPage - 1)
      }
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage)
      }
      if (currentPage < totalPages - 1) {
        pages.push(currentPage + 1)
      }
      
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    return pages
  }

  const currentRequests = activeTab === "to-me" ? requestsToMe : myRequests
  const paginatedRequests = currentRequests

  const handleGrantAccess = async (request: AccessRequest) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const messageHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["string", "string", "uint256"],
        [request.tenderId, request.documentName, deadline]
      )
    )
    const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))
    const splitSig = ethers.utils.splitSignature(signature)

    const {encryptedKey, iv} = await getKey(address as string, request.cid)
    if (!encryptedKey) {
      toast.error("No encrypted key found, you don't have access to this document");
      return false;
    }

    const publicKeyStorageAddress = import.meta.env.VITE_PUBLIC_KEY_STORAGE_CONTRACT_ADDRESS;
    const publicKeyStorageContract = new ethers.Contract(publicKeyStorageAddress, PublicKeyStorageArtifact.abi, signer);

    const requesterPublicKeyString = await publicKeyStorageContract.getPublicKey(request.requester);
    

    let requesterPublicKey;
    try {
      requesterPublicKey = JSON.parse(requesterPublicKeyString);
    } catch (error) {
      toast.error("Invalid public key format");
      return;
    }

    const passphrase = await prompt("Enter passphrase")
    if (!passphrase) {
      toast.error("No passphrase entered");
      return;
    }

    const symmetricKey = await decryptSymmetricKey(address as string, passphrase, encryptedKey)

    const encryptedSymmetricKey = await encryptSymmetricKeyWithPublicKey(symmetricKey, requesterPublicKey)
     
    const response = await grantAccess(request.requester, request.tenderId, request.cid, request.documentName, encryptedSymmetricKey, iv, deadline, splitSig.v, splitSig.r, splitSig.s)
    if (response.success) {
      toast.success("Access granted!")
    } else {
      toast.error("Failed to grant access")
    }
  }

  const handleDownload = async (request: AccessRequest) => {
    const doc = {
      documentCid: request.cid,
      documentName: request.documentName,
      documentType: "",
      documentFormat: request.documentFormat,
      submissionDate: "",
    }
    await downloadEncryptedFileWithDialog(address as string, doc)
  }

  const renderRequestCard = (request: AccessRequest) => (
    <Card key={request.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg line-clamp-1">{request.documentName}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">
          Document access request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">File:</span>
            <span className="ml-2 font-medium truncate" title={request.documentName}>
              {request.documentName}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">CID:</span>
            <span className="ml-2 font-mono text-xs break-all" title={request.cid}>
              {request.cid}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Tender:</span>
            <span className="ml-2 font-mono text-xs break-all" title={request.tenderId}>
              {request.tenderId}
            </span>
          </div>
          {activeTab === "to-me" ? (
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Requester:</span>
              <span className="ml-2 font-mono" title={request.requester}>
                {shortenAddress(request.requester)}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Receiver:</span>
              <span className="ml-2 font-mono" title={request.receiver}>
                {shortenAddress(request.receiver)}
              </span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Requested:</span>
            <span className="ml-2">
              {formatDate(request.blockTimestamp)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {activeTab === "to-me" ? (
          <Button
            size="sm"
            onClick={() => handleGrantAccess(request)}
            className="flex-1"
          >
            Grant Access
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => handleDownload(request)}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
      </CardFooter>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SearchHeader title="Access Requests" placeholder="file names" />
        <div className="p-6">
          <div className="text-center mb-6">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <SearchHeader title="Access Requests" />
        <div className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SearchHeader title="Access Requests" onSearch={handleSearch} placeholder="file names" />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="to-me" className="flex-1">Requests to Me</TabsTrigger>
            <TabsTrigger value="my-requests" className="flex-1">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="to-me" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedRequests.map(renderRequestCard)}
            </div>

            {paginatedRequests.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No requests to you found
                </h3>
                <p className="text-sm text-muted-foreground">
                  There are no access requests made to you.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedRequests.map(renderRequestCard)}
            </div>

            {paginatedRequests.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No requests found
                </h3>
                <p className="text-sm text-muted-foreground">
                  You haven't made any access requests yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1)
                    }
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getVisiblePages().map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1)
                    }
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
} 