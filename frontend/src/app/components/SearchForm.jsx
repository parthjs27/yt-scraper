import { useState } from 'react';

export default function SearchForm({ onSubmit, loading }) {
  const [searchQuery, setSearchQuery] = useState('tech reviews 2025');
  const [maxChannels, setMaxChannels] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(searchQuery, maxChannels);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="searchQuery" className="block text-gray-700 font-medium mb-2">
          Search Query
        </label>
        <input
          type="text"
          id="searchQuery"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="maxChannels" className="block text-gray-700 font-medium mb-2">
          Max Channels to Scrape
        </label>
        <select
          id="maxChannels"
          value={maxChannels}
          onChange={(e) => setMaxChannels(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        {/* <input
          type="text"
          id="maxChannels"
          value={maxChannels}
          onChange={(e) => setMaxChannels(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        /> */}
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Scraping...' : 'Scrape Channels'}
      </button>
    </form>
  );
}