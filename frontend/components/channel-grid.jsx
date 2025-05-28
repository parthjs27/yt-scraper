"use client"

import ChannelCard from "./channel-card"



export default function ChannelGrid({ channels, selectedChannel, onChannelSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          isSelected={selectedChannel.id === channel.id}
          onClick={() => onChannelSelect(channel)}
        />
      ))}
    </div>
  )
}
