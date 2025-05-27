"use client"

import { useState } from "react"
import SearchForm from "@/components/search-form"
import ResultsHeader from "@/components/results-header"
import ChannelGrid from "@/components/channel-grid"
// import ChannelDetail from "./components/channel-detail"

// Mock data for demonstration
const mockChannels = [
  {
    id: "1",
    name: "Tech Channel",
    nationality: "US",
    joinedOn: "2020-01-15",
    subscribers: "1.2M",
    videos: 245,
    totalViews: "50M",
  },
  {
    id: "2",
    name: "Gaming Hub",
    nationality: "UK",
    joinedOn: "2019-08-22",
    subscribers: "850K",
    videos: 189,
    totalViews: "32M",
  },
  {
    id: "3",
    name: "Cooking Master",
    nationality: "FR",
    joinedOn: "2021-03-10",
    subscribers: "2.1M",
    videos: 156,
    totalViews: "78M",
  },
  {
    id: "4",
    name: "Music Vibes",
    nationality: "CA",
    joinedOn: "2018-11-05",
    subscribers: "3.5M",
    videos: 312,
    totalViews: "120M",
  },
  {
    id: "5",
    name: "Travel Explorer",
    nationality: "AU",
    joinedOn: "2020-07-18",
    subscribers: "675K",
    videos: 98,
    totalViews: "25M",
  },
]

export default function YTScraperApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [maxChannels, setMaxChannels] = useState("")
  const [selectedChannel, setSelectedChannel] = useState(mockChannels[0])
  const [results, setResults] = useState(mockChannels)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (query, max) => {
    setIsSearching(true)
    setSearchQuery(query)
    setMaxChannels(max)

    // Simulate API call
    setTimeout(() => {
      setResults(mockChannels.slice(0, Number.parseInt(max) || mockChannels.length))
      setIsSearching(false)
    }, 1000)
  }

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel)
  }

  const handleDownloadCSV = () => {
    const csvContent = [
      ["Channel Name", "Nationality", "Joined On", "Subscribers", "Videos", "Total Views"],
      ...results.map((channel) => [
        channel.name,
        channel.nationality,
        channel.joinedOn,
        channel.subscribers,
        channel.videos.toString(),
        channel.totalViews,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "youtube_channels.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-8">YT SCRAPER</h1>
          <SearchForm onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {results.length > 0 && (
          <>
            <ResultsHeader count={results.length} onDownloadCSV={handleDownloadCSV} />

            <div className="mt-8">
              <ChannelGrid channels={results} selectedChannel={selectedChannel} onChannelSelect={handleChannelSelect} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
