"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy } from "lucide-react"
import { formatDate, shortenAddress } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface Participant {
  address: string
  name: string
  applicationDate: string
  documentUrl: string
}

interface ParticipantsListProps {
  isOwner: boolean
  participants: Participant[]
  winnerId: string
  tenderId: string
}

export function ParticipantsList({ isOwner, participants, winnerId, tenderId }: ParticipantsListProps) {
  const navigate = useNavigate()

  const handleViewSubmissions = (participantAddress: string) => {
    navigate(`/tenders/${tenderId}/submissions/${participantAddress}`)
  }

  return (
    <div className="space-y-3">
      {participants.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No participants yet</p>
      ) : (
        participants.map((participant, index) => {
          const isWinner = participant.address === winnerId

          return (
            <Card key={index} className={`overflow-hidden ${isWinner ? "border-green-300 bg-green-50" : ""}`}>
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex flex-col mb-2">
                    <span className="text-xs text-muted-foreground mb-1" title={participant.address}>
                      {shortenAddress(participant.address)}
                    </span>
                    <div className="flex items-center">
                      <h3 className="font-medium truncate">{participant.name}</h3>
                      {isWinner && (
                        <div className="ml-2 flex items-center text-green-600">
                          <Trophy className="h-4 w-4 mr-1" />
                          <span className="text-xs font-semibold">Winner</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>Applied: {formatDate(participant.applicationDate)}</span>
                  </div>

                  {isOwner && (
                    <div className="flex justify-end">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleViewSubmissions(participant.address)}
                      >
                        View Submissions
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
