"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

export default function ChannelCard({ channel, isSelected, onClick }) {
  const formatNumber = (value) => {
    if (typeof value === 'string') {
      // Remove any non-numeric characters except decimal points
      const num = value.replace(/[^0-9.]/g, '');
      return new Intl.NumberFormat().format(parseFloat(num));
    }
    return new Intl.NumberFormat().format(value);
  };

  const handleExternalLinkClick = (e) => {
    e.stopPropagation();
    window.open(channel.id, '_blank');
  };

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
            <button
              onClick={handleExternalLinkClick}
              className="p-1 hover:bg-gray-600 rounded-full transition-colors"
              title="Open channel in YouTube"
            >
              <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
            </button>
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
            <div className="text-white">{formatNumber(channel.videos)}</div>
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
