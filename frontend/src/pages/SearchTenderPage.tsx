import { useEffect, useState } from "react"
import { SearchHeader } from "@/components/SearchHeader"
import { TenderCard } from "@/components/TenderCard"
import { getTenders, type Tender } from "@/lib/api"


export default function SearchTenders() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  // const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const tenders = await getTenders()
        if (tenders) {
          setTenders(tenders)
        } else {
          setError("Failed to fetch tenders")
        }
      } catch (err) {
        setError("An error occurred while fetching tenders")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTenders()
  }, [])


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SearchHeader title="Search Tenders" />
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <SearchHeader title="Search Tenders" />
        <div className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SearchHeader title="Search Tenders" />

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tenders.map((tender, index) => (
            <TenderCard
              key={index}
              id={tender.tenderId}
              owner={tender.owner}
              name={tender.name}
              description={tender.description}
              startDate={tender.startDate}
              endDate={tender.endDate}
              // winner={tender.winner}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
