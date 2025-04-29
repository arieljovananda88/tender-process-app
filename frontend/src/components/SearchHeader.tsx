"use client"

import { useState } from "react"
import { Search } from "lucide-react" // Filter
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchHeaderProps {
  title: string
  onSearch?: (query: string) => void
}

export function SearchHeader({ title, onSearch }: SearchHeaderProps) {
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
            placeholder="Search tenders..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="flex gap-2">
          {/* <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="it">IT Services</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button> */}
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>
    </div>
  )
}
