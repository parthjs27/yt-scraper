"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"


export default function ChannelCard({ channel, isSelected, onClick }) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 bg-gray-800 border-gray-600 hover:bg-gray-700 ${
        isSelected ? "ring-2 ring-blue-500 bg-gray-700" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            {channel.name}
            <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
          </h3>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Nationality:</span>
            <div className="text-white">{channel.nationality}</div>
          </div>

          <div>
            <span className="text-gray-400">Joined on:</span>
            <div className="text-white">{channel.joinedOn}</div>
          </div>

          <div>
            <span className="text-gray-400">Subscribers:</span>
            <div className="text-white">{channel.subscribers}</div>
          </div>

          <div>
            <span className="text-gray-400">Videos:</span>
            <div className="text-white">{channel.videos}</div>
          </div>

          <div>
            <span className="text-gray-400">Total views:</span>
            <div className="text-white">{channel.totalViews}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
