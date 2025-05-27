export default function ChannelCard({ channel }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-blue-600">
          <a href={channel.channel_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {channel.channel_url.split('/').pop()}
          </a>
        </h3>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center">
            <span className="text-gray-600 font-medium w-24">Nationality:</span>
            <span>{channel.nationality}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 font-medium w-24">Joined:</span>
            <span>{channel.joined_on}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 font-medium w-24">Subscribers:</span>
            <span>{channel.subscribers}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 font-medium w-24">Videos:</span>
            <span>{channel.videos_count}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 font-medium w-24">Total Views:</span>
            <span>{channel.total_views}</span>
          </div>
        </div>
        
        <a 
          href={channel.channel_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors"
        >
          Visit Channel
        </a>
      </div>
    </div>
  );
}