"use client"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Clock, ArrowLeft, Trophy } from "lucide-react"
import { ParticipantsList } from "@/components/ParticipantsList"
import { DocumentList } from "@/components/DocumentList"
import { RequestTenderAccess } from "@/components/RequestTenderAccess"
import { getTenderById } from "@/lib/api_the_graph" 
import { Document, Tender } from "@/lib/types"
import { formatDate, calculateTimeRemaining, showPassphraseDialog } from "@/lib/utils"
import { useAccount } from "wagmi";
import { useTenderManager } from '@/hooks/useContracts';
import { getDocumentStoreContract, getTenderManagerContract } from "@/lib/contracts"

export default function TenderDetailPage() {
  const { id } = useParams()
  const { address } = useAccount();
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [winnerAddress, setWinnerAddress] = useState<string | null>(null)
  const [participantLoading, setParticipantLoading] = useState(false);
  const [infoDocuments, setInfoDocuments] = useState<Document[]>([]);
  const [tenderDocuments, setTenderDocuments] = useState<Document[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const { getWinner, parseParticipants } = useTenderManager();
  const [participants, setParticipants] = useState<any[]>([]);
  const isOwner = address?.toLowerCase() === tender?.owner.toLowerCase()
  const isWinner = address?.toLowerCase() === winnerAddress?.toLowerCase()
  const isActive = tender ? new Date(Number(tender.endDate) * 1000).getTime() > Date.now() : false
  const [isThirdParty, setIsThirdParty] = useState(false);
  const userRole = JSON.parse(localStorage.getItem("user") || '{}').role;

  useEffect(() => {
    const fetchTender = async () => {
      try {
        const tender = await getTenderById(id as string)
        setTender(tender)
        const winner = await getWinner(id as string)
        if (winner && winner !== "0x0000000000000000000000000000000000000000") {
          setWinnerAddress(winner)
        }
        const contract = await getDocumentStoreContract();
        const infoDocs = await contract.getTenderInfoDocuments(id as string)
        setInfoDocuments(infoDocs)
      } catch (err) {
        setError("Failed to fetch tender")
      } finally {
        setLoading(false)
      }
    }

    const fetchParticipants = async () => {
      const passphrase = await showPassphraseDialog();
      if (!passphrase) {
        return [];
      }
      setParticipantLoading(true);
      const contract = await getTenderManagerContract();
      const participants = await contract.getParticipants(id as string);
      if (participants.length > 0) {
        const participantsList = participants.map((participant: any) => ({
          address: participant.participantAddress,
          name: participant.name,
        }));
        setParticipantLoading(false);
        setParticipants(participantsList);
        return
      }
  
      const result = await parseParticipants(address as string, passphrase, id as string);
      const user = localStorage.getItem("user")
      const userData = user ? JSON.parse(user) : null

      if (result) {
        if (userData.role === "participant") {
          const tenderDocuments = result.filtered.map((doc: Document) => ({
            documentCid: doc.documentCid,
            documentName: doc.documentName,
            documentFormat: doc.documentFormat,
            submissionDate: doc.submissionDate
          }));
          setTenderDocuments(tenderDocuments);
        }

        setParticipants(result.participants);
        setIsRegistered(result.participantsMap.has(address?.toLowerCase() as string));
      }
    
      setParticipantLoading(false);
    }

    const checkThirdParty = async () => {
      const contract = await getTenderManagerContract();
      const isThirdParty = await contract.isThirdPartyParticipant(id as string, address as string);
      setIsThirdParty(isThirdParty);
    }

    checkThirdParty();
    fetchTender()
    fetchParticipants();
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

        {/* Main content - center */}
        <div className={`space-y-6 xl:col-span-8`}>
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{tender.name}</h1>
            <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {isActive ? "Active" : "Finished"}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-1 h-4 w-4" />
            <span title={tender.owner}>Owner: {isOwner ? "You" : tender.owner}</span>
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

          {/* <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{tender.description}</p>
          </div> */}

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Tender Information Documents</h2>
            <DocumentList
              documents={infoDocuments}
              isRegistered={true}
              isActive={isActive}
              typeOfFile="Info"
              iconSize={10}
              textSize="base"
              canUpload={isOwner}
            />
          </div>
        </div>

        {/* Right sidebar - Participants (for owners) or Application status (for non-owners) */}
        <div className="xl:col-span-4 space-y-6">
          {isOwner || userRole === "third_party" ? (
            // Participants section for tender owner
            <div>
              <h2 className="text-lg font-semibold mb-4">Participants</h2>
              {participantLoading ? (
                <div className="text-center text-muted-foreground py-4">Loading participants...</div>
              ) : userRole === "third_party" && !isThirdParty ? (
                <RequestTenderAccess
                  tenderId={id as string}
                  tenderOwner={tender?.owner || ""}
                  tenderName={tender?.name || ""}
                />
              ) : (
                <ParticipantsList
                  forPending={false}
                  participants={participants}
                  winnerId={winnerAddress}
                  tenderId={id as string}
                />
              )}
            </div>
          ) : (
            // Application status and Registration Documents for non-owners
            <>
              {/* Application status card - simplified */}
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-3">Application Status</h2>
                  {isWinner ? (
                    <>
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4" />
                        <p className="font-medium">Winner!</p>
                      </div>
                      <p className="text-sm">
                        Congratulations! You have been selected as the winner of this tender.
                      </p>
                    </div>
                    </>
                  ) : isActive ? (
                    <>
                        {isRegistered ? (
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-md">
                          <p className="font-medium">Registered</p>
                          <p className="text-sm mt-1">
                            You have already registered for this tender. You can see your uploaded documents below.
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

                {!winnerAddress ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold mb-2">Your Bid Documents</h2>
                    <DocumentList
                      typeOfFile="Tender"
                      documents={tenderDocuments}
                      isRegistered={isRegistered}
                      isActive={isActive}
                      iconSize={8}
                      textSize="sm"
                      canUpload={true}
                    />
                  </div>
                ) : (
                  <>
                  <h2 className="text-lg font-semibold mb-3">Final Participants</h2>
                  <ParticipantsList
                    forPending={false}
                    participants={participants}
                    winnerId={winnerAddress}
                    tenderId={id as string}
                  />
                  </>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
