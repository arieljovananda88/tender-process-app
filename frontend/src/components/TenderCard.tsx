import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDate, shortenAddress } from "@/lib/utils"

interface TenderCardProps {
  id: string
  owner: string
  name: string
  startDate: string
  endDate: string
}

export function TenderCard({ id, owner, name, startDate, endDate }: TenderCardProps) {
  const isActive = new Date(Number(endDate) * 1000).getTime() > Date.now()

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-2">{name}</CardTitle>
          <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {isActive ? "Active" : "Finished"}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <User className="size-3.5" />
          <span title={owner}>Owner: {shortenAddress(owner)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            <span>Start: {formatDate(startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            <span>End: {formatDate(endDate)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline" size="sm">
          <Link to={`/tenders/${id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
