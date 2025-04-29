"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy } from "lucide-react"

interface Participant {
  address: string
  name: string
  applicationDate: number
  documentUrl: string
}

interface ParticipantsListProps {
  isOwner: boolean
  participants: Participant[]
  winnerId: string
}

export function ParticipantsList({ isOwner, participants, winnerId }: ParticipantsListProps) {
  // Format the timestamps to readable dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Shorten address for display
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
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
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="font-medium">{participant.name}</h3>
                      {isWinner && (
                        <div className="ml-2 flex items-center text-green-600">
                          <Trophy className="h-4 w-4 mr-1" />
                          <span className="text-xs font-semibold">Winner</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground" title={participant.address}>
                      {shortenAddress(participant.address)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>Applied: {formatDate(participant.applicationDate)}</span>
                  </div>

                  {isOwner && (
                    <div className="flex justify-end">
                      <Button variant="default" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
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
