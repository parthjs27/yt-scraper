"use client"

import { useState } from "react"
import SearchForm from "@/components/search-form"
import ResultsHeader from "@/components/results-header"
import ChannelGrid from "@/components/channel-grid"

export default function YTScraperApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [maxChannels, setMaxChannels] = useState("")
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (query, max) => {
    setIsSearching(true)
    setError(null)
    setSearchQuery(query)
    setMaxChannels(max)

    try {
      // First, queue the scrape job
      const queueResponse = await fetch('http://127.0.0.1:8000/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          search_query: query,
          max_channel_links: parseInt(max) || 10
        })
      });

      if (!queueResponse.ok) {
        throw new Error('Failed to queue scrape job');
      }

      const queueData = await queueResponse.json();
      const jobId = queueData.job_id;

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts with 2 second delay = 1 minute timeout
      
      while (attempts < maxAttempts) {
        const resultsResponse = await fetch(`http://127.0.0.1:8000/data/${jobId}`);
        
        if (resultsResponse.ok) {
          const data = await resultsResponse.json();
          
          if (data.status === 'completed') {
            const formattedChannels = data.channel_details.map(channel => ({
              id: channel.channel_url,
              name: channel.channel_url.split('@')[1],
              nationality: channel.nationality === 'Not found' ? 'Unknown' : channel.nationality,
              joinedOn: channel.joined_on === 'Not found' ? 'Unknown' : channel.joined_on,
              subscribers: channel.subscribers === 'Not found' ? '0' : channel.subscribers,
              videos: channel.videos_count === 'Not found' ? 0 : parseInt(channel.videos_count.replace(/[^0-9]/g, '')),
              totalViews: channel.total_views === 'Not found' ? '0' : channel.total_views,
            }));
            
            setResults(formattedChannels);
            if (formattedChannels.length > 0) {
              setSelectedChannel(formattedChannels[0]);
            } else {
              setSelectedChannel(null);
            }
            break;
          }
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Scraping timed out. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      setResults([]);
      setSelectedChannel(null);
    } finally {
      setIsSearching(false);
    }
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
    .map((row) => row.map((val) => `"${val}"`).join(","))  // 👈 Wrap each value in quotes
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "youtube_channels.csv";
  a.click();
  window.URL.revokeObjectURL(url);
};


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-8">YT SCRAPER</h1>
          <SearchForm onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {isSearching && (
          <div className="text-center text-gray-400 mb-4">
            Searching for channels...
          </div>
        )}

        {results.length > 0 && (
          <>
            <ResultsHeader count={results.length} onDownloadCSV={handleDownloadCSV} />

            <div className="mt-8">
              <ChannelGrid channels={results} selectedChannel={selectedChannel} onChannelSelect={handleChannelSelect} />
            </div>
          </>
        )}

        {!isSearching && results.length === 0 && !error && (
          <div className="text-center text-gray-400 mt-8">
            No results found. Try searching for channels.
          </div>
        )}
      </div>
    </div>
  )
}
