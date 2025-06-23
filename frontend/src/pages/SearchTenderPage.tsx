import React, { useEffect, useState } from "react"
import { SearchHeader } from "@/components/SearchHeader"
import { TenderCard } from "@/components/TenderCard"
import { getTenders, getTendersLength, type Tender } from "@/lib/api"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 12

export default function SearchTenders() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const handleSearch = (query: string) => {
    const fetchTenders = async () => {
      try {
        const tenders = await getTenders(query)
        const length = await getTendersLength(query)
        if (tenders) {
          setTenders(tenders)
          setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
          setCurrentPage(1)
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
  }

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const tenders = await getTenders()
        const length = await getTendersLength()
        if (tenders) {
          setTenders(tenders)
          setTotalPages(Math.ceil(length / ITEMS_PER_PAGE))
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

  const getVisiblePages = () => {
    const pages = []
    if (totalPages <= 1) {
      // Always show at least one page
      pages.push(1)
    } else if (totalPages <= 3) {
      // If total pages is 2 or 3, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Show current page and one before/after if possible
      if (currentPage > 2) {
        pages.push(currentPage - 1)
      }
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage)
      }
      if (currentPage < totalPages - 1) {
        pages.push(currentPage + 1)
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    return pages
  }

  const paginatedTenders = tenders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
      <SearchHeader title="Search Tenders" onSearch={handleSearch} />

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedTenders.map((tender, index) => (
            <TenderCard
              key={index}
              id={tender.tenderId}
              owner={tender.owner}
              name={tender.name}
              description={tender.description}
              startDate={tender.startDate}
              endDate={tender.endDate}
            />
          ))}
        </div>

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
