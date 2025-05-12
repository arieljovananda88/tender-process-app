"use client"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Clock, ArrowLeft } from "lucide-react"
import { ParticipantsList } from "@/components/ParticipantsList"
import { DocumentList } from "@/components/DocumentList"
import { getTenderById, type Tender } from "@/lib/api"
import { formatDate, shortenAddress, calculateTimeRemaining } from "@/lib/utils"
import { useAccount } from "wagmi";
import { useTenderManager, useDocumentStore } from '@/hooks/useContracts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function TenderDetailPage() {
  const { id } = useParams()
  const { address } = useAccount();
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { documents, fetchDocuments } = useDocumentStore();

  const { isPending, isRegistered, checkRegistrationStatus, participants, pendingParticipants } = useTenderManager();

  const isOwner = address?.toLowerCase() === tender?.owner.toLowerCase()
  const isActive = tender ? new Date(tender.endDate).getTime() > Date.now() : false

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

  useEffect(() => {
    if (id) {
      checkRegistrationStatus(id);
      fetchDocuments(id);
    }
  }, [id, checkRegistrationStatus, fetchDocuments]);

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
        {/* Left sidebar - Participants (only for non-owners) */}
        {!isOwner && (
          <div className="xl:col-span-3">
            <h2 className="text-lg font-semibold mb-4">Participants</h2>
            <Tabs defaultValue="participants" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="participants" className="flex-1">Participants</TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
              </TabsList>
              <TabsContent value="participants" className="space-y-6 mt-6">
                <ParticipantsList
                  forPending={false}
                  participants={participants}
                  winnerId={tender.winner}
                  isOwner={isOwner}
                  tenderId={id as string}
                />
              </TabsContent>
              <TabsContent value="pending" className="space-y-6 mt-6">
                <ParticipantsList
                  forPending={true}
                  participants={pendingParticipants}
                  winnerId={tender.winner}
                  isOwner={isOwner}
                  tenderId={id as string}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Main content - center */}
        <div className={`space-y-6 ${isOwner ? 'xl:col-span-12' : 'xl:col-span-6'}`}>
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{tender.name}</h1>
            <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {isActive ? "Active" : "Finished"}
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

          {/* Participants (only for owners) */}
          {isOwner && (
            <>
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Participants</h2>
              <ParticipantsList
                forPending={false}
                participants={participants}
                winnerId={tender.winner}
                isOwner={isOwner}
                tenderId={id as string}
              />
            </div>
            <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Pending Participants</h2>
            <ParticipantsList
              forPending={true}
              participants={pendingParticipants}
              winnerId={tender.winner}
              isOwner={isOwner}
              tenderId={id as string}
            />
          </div>
          </>

          )}

          {/* Documents Section - Changes based on registration status */}
          {!isOwner && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">
                {isRegistered ? "Tender Documents" : "Registration Documents"}
              </h2>
              <DocumentList
                documents={isRegistered ? documents.tenderDocuments : documents.registrationDocuments}
                isRegistered={isRegistered}
                isActive={isActive}
                typeOfFile={isRegistered ? "Tender" : "Registration"}
                iconSize={10}
                textSize="base"
                canUpload={true}
              />
            </div>
          )}
        </div>

        {/* Right sidebar - Application status and Registration Documents */}
        {!isOwner && (
          <div className="xl:col-span-3 space-y-6">
            {/* Application status card - simplified */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-3">Application Status</h2>
                {isActive ? (
                  <>
                    {isPending ? (
                      <div className="bg-amber-50 text-amber-800 p-3 rounded-md">
                        <p className="font-medium">Waiting for Approval</p>
                        <p className="text-sm mt-1">
                          Your registration is pending approval from the tender owner.
                        </p>
                      </div>
                    ) : isRegistered ? (
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

            {/* Registration Documents - Only show when registered */}
            {isRegistered && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-2">Registration Documents</h2>
                <DocumentList
                  typeOfFile="Registration"
                  documents={documents.registrationDocuments}
                  isRegistered={isRegistered}
                  isActive={isActive}
                  iconSize={8}
                  textSize="sm"
                  canUpload={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
