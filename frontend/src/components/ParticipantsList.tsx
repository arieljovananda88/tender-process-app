"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { shortenAddress } from "@/lib/utils"
import { Participant } from "@/lib/types"

interface ParticipantsListProps {
  forPending: boolean
  participants: Participant[]
  winnerId: string | null
  tenderId: string
}

export function ParticipantsList({ forPending = false, participants, winnerId, tenderId }: ParticipantsListProps) {
  const navigate = useNavigate()

  const handleViewSubmissions = (participantAddress: string) => {
    navigate(`/tenders/${tenderId}/submissions/${participantAddress}`)
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {participants.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          {forPending ? "No pending participants" : "No participants yet"}
        </p>
      ) : (
        participants.map((participant, index) => {
          const isWinner = winnerId && participant.address.toLowerCase() === winnerId.toLowerCase()

          return (
            <Card key={index} className={`overflow-hidden ${isWinner ? "border-green-300 bg-green-50" : ""}`}>
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex flex-col mb-2">
                    <span className="text-xs text-muted-foreground mb-1" title={shortenAddress(participant.address)}>
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
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
