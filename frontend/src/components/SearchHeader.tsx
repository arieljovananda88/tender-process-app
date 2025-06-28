"use client"

import { useState } from "react"
import { Search } from "lucide-react" // Filter
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchHeaderProps {
  title: string
  onSearch?: (query: string) => void
  placeholder?: string
}

export function SearchHeader({ title, onSearch, placeholder = "tenders" }: SearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  return (
    <div className="p-6 border-b">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${placeholder}...`}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>
    </div>
  )
}
