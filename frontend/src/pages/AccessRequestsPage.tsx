import React, { useEffect, useState } from "react"
import { SearchHeader } from "@/components/SearchHeader"
import { getAccessRequests, getAccessRequestsLength, getAccessRequestsToMe, getAccessRequestsToMeLength, getKey, getTenderAccessRequestsByMeLength, getTenderAccessRequestsByMe, getTenderAccessRequestsToMeLength, getTenderAccessRequestsToMe } from "@/lib/api_the_graph"
import { AccessRequest } from "@/lib/types"

interface TenderRequest {
  requester: string;
  receiver: string;
  tenderId: string;
  tenderName: string;
  tenderStartDate: string;
  tenderEndDate: string;
}
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
import { FileText, User, Calendar, Download, Building2 } from "lucide-react"
import { decryptSymmetricKey, encryptWithPublicKey, formatDate, shortenAddress, downloadEncryptedFileWithDialog, showPassphraseDialog } from "@/lib/utils"
import { useAccount } from "wagmi"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-toastify"
import { grantAccess, grantTenderAccess } from "@/lib/api_contract"
import { getPublicKeyStorageContract } from "@/lib/contracts"

const ITEMS_PER_PAGE = 8

export default function AccessRequestsPage() {
  const { address } = useAccount()
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([])
  const [requestsToMe, setRequestsToMe] = useState<AccessRequest[]>([])
  const [tenderRequests, setTenderRequests] = useState<TenderRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("tender-requests")
  const [userRole, setUserRole] = useState<string>("")

  // Get user role from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      setUserRole(userData.role || "")
    }
  }, [])

  // Fetch data for current page
  const fetchPageData = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      
      if (activeTab === "tender-requests") {
        if (userRole === "organizer") {
          // Organizers see requests to them
          const requestsToMeData = await getTenderAccessRequestsToMe(address as string, offset, ITEMS_PER_PAGE)
          const length = await getTenderAccessRequestsToMeLength(address as string)
          if (requestsToMeData) {
            setTenderRequests(requestsToMeData)
            setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
          }
        } else {
          // Third parties see their own requests
          const myRequestsData = await getTenderAccessRequestsByMe(address as string, offset, ITEMS_PER_PAGE)
          const length = await getTenderAccessRequestsByMeLength(address as string)
          if (myRequestsData) {
            setTenderRequests(myRequestsData)
            setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
          }
        }
      } else {
        // Content requests - different behavior based on role
        if (userRole === "organizer") {
          // Organizers see requests to them
          const requestsToMeData = await getAccessRequestsToMe("", offset, ITEMS_PER_PAGE, address as string)
          const length = await getAccessRequestsToMeLength("", address as string)
          if (requestsToMeData) {
            setRequestsToMe(requestsToMeData)
            setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
          }
        } else {
          // Third parties see their own requests
          const myRequestsData = await getAccessRequests("", offset, ITEMS_PER_PAGE, address as string)
          const length = await getAccessRequestsLength("", address as string)
          if (myRequestsData) {
            setMyRequests(myRequestsData)
            setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
          }
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
    if (address && userRole) {
      fetchPageData()
    }
  }, [address, currentPage, activeTab, userRole])

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

  const currentRequests = userRole === "organizer" ? requestsToMe : myRequests
  const currentTenderRequests = tenderRequests
  const paginatedRequests = currentRequests

  const handleGrantAccess = async (request: AccessRequest) => {

    const {encryptedKey, iv} = await getKey(address as string, request.cid)
    if (!encryptedKey) {

      return false;
    }

    const publicKeyStorageContract = await getPublicKeyStorageContract();

    const requesterPublicKeyString = await publicKeyStorageContract.getPublicKey(request.requester);
    

    let requesterPublicKey;
    try {
      requesterPublicKey = JSON.parse(requesterPublicKeyString);
    } catch (error) {
      toast.error("Invalid public key format");
      return;
    }

    const passphrase = await prompt("Enter passphrase for granting access")
    if (!passphrase) {
      toast.error("No passphrase entered");
      return;
    }

    const symmetricKey = await decryptSymmetricKey(address as string, passphrase, encryptedKey)

    const encryptedSymmetricKey = await encryptWithPublicKey(symmetricKey, requesterPublicKey)
     
    const response = await grantAccess(request.requester, request.cid, encryptedSymmetricKey, iv)
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

  const handleGrantTenderAccess = async (request: TenderRequest) => {
    const passphrase = await showPassphraseDialog()
    if (!passphrase) {
      toast.error("No passphrase entered");
      return;
    }
    try {
      const response = await grantTenderAccess(request.tenderId, request.requester, passphrase, address as string)
      if (response.success) {
        toast.success("Tender access granted!")
      } else {
        toast.error("Failed to grant tender access")
      }
    } catch (error: any) {
      console.error("Error granting tender access:", error)
      toast.error(`Failed to grant tender access: ${error.message}`)
    }
  }

  const handleCheckTenderAccess = (tenderId: string) => {
    // Navigate to tender detail page
    window.location.href = `/tenders/${tenderId}`
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
          {userRole === "organizer" ? (
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
        {userRole === "organizer" ? (
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

  const renderTenderRequestCard = (request: TenderRequest) => (
    <Card key={`${request.receiver}-${request.tenderId}`} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-green-500" />
          <CardTitle className="text-lg line-clamp-1">Tender Access Request</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">
          Request to access tender participants.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <span className="font-medium">Tender ID:</span>
            <span className="ml-2 font-medium truncate" title={request.tenderId}>
              {request.tenderId}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium">Name:</span>
            <span className="ml-2 font-medium truncate" title={request.tenderName}>
              {shortenAddress(request.tenderName)}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium">Start Date:</span>
            <span className="ml-2 font-medium truncate" title={request.tenderStartDate}>
              {formatDate(request.tenderStartDate)}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium">End Date:</span>
            <span className="ml-2 font-medium truncate" title={request.tenderEndDate}>
              {formatDate(request.tenderEndDate)}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium">Receiver:</span>
            <span className="ml-2 font-mono" title={request.receiver}>
              {shortenAddress(request.receiver)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {userRole === "organizer" ? (
          <Button
            size="sm"
            onClick={() => handleGrantTenderAccess(request)}
            className="flex-1"
          >
            Grant Access
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => handleCheckTenderAccess(request.tenderId)}
            className="flex-1"
          >
            Check Access
          </Button>
        )}
      </CardFooter>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
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
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="tender-requests" className="flex-1">Tender Requests</TabsTrigger>
            <TabsTrigger value="content-requests" className="flex-1">Content Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="tender-requests" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentTenderRequests.map(renderTenderRequestCard)}
            </div>

            {currentTenderRequests.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No tender requests found
                </h3>
                <p className="text-sm text-muted-foreground">
                  There are no tender access requests made to you.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="content-requests" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedRequests.map(renderRequestCard)}
            </div>

            {paginatedRequests.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No content requests found
                </h3>
                <p className="text-sm text-muted-foreground">
                  There are no content access requests.
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