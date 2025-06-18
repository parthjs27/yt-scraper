"use client"


import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function SearchForm({ onSearch, isLoading }) {
  const [query, setQuery] = useState("")
  const [maxChannels, setMaxChannels] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query, maxChannels)
    }
  }

  return (
    <div className="border border-gray-600 rounded-lg p-6 max-w-md mx-auto bg-gray-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="search-query" className="text-sm text-gray-300 mb-2 block">
            Search Query
          </Label>
          <Input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Enter search term..."
          />
        </div>

        <div>
          <Label htmlFor="max-channels" className="text-sm text-gray-300 mb-2 block">
            Max Channels
          </Label>
          <Input
            id="max-channels"
            type="number"
            value={maxChannels}
            onChange={(e) => setMaxChannels(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="e.g., 10"
          />
        </div>

        <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-600 text-white" disabled={isLoading}>
          {isLoading ? "Searching..." : "START"}
        </Button>
      </form>
    </div>
  )
}
