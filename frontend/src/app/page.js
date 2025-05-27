// 'use client';
// import { useState } from 'react';
// import Header from './components/Header';
// import SearchForm from './components/SearchForm';
// import ChannelCard from './components/ChannelCard';

// export default function Home() {
//   const [results, setResults] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleSearch = async (searchQuery, maxChannels) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       const response = await fetch('/api/scrape', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ searchQuery, maxChannels }),
//       });

//       if (!response.ok) {
//         throw new Error('Scraping failed');
//       }

//       const data = await response.json();
//       setResults(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen">
//       <Header />
//       <main className="container mx-auto px-4 py-8">
//         <SearchForm onSubmit={handleSearch} loading={loading} />
        
//         {loading && (
//           <div className="flex justify-center my-8">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         )}

//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
//             <strong className="font-bold">Error: </strong>
//             <span className="block sm:inline">{error}</span>
//           </div>
//         )}

//         {results && (
//           <div className="mt-8">
//             <h2 className="text-2xl font-bold mb-4">Results ({results.length} channels found)</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {results.map((channel, index) => (
//                 <ChannelCard key={index} channel={channel} />
//               ))}
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

'use client';
import { useState } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import ChannelCard from './components/ChannelCard';

export default function Home() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleSearch = async (searchQuery, maxChannels) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery, maxChannels }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scraping failed');
      }

      // Check if response is CSV
      const contentType = response.headers.get('content-type');
      if (contentType.includes('text/csv')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'channel_details.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        // Trigger a second request for JSON results to display
        await fetchResults(searchQuery, maxChannels);
      } else {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (searchQuery, maxChannels) => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Type': 'json', // Custom header to request JSON
        },
        body: JSON.stringify({ searchQuery, maxChannels }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scraping failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async () => {
    if (!results) {
      setError('No results to download. Please search first.');
      return;
    }

    setDownloadLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery: results[0]?.searchQuery || 'tech reviews 2025', maxChannels: results.length }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'channel_details.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SearchForm onSubmit={handleSearch} loading={loading} />
        
        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {results && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Results ({results.length} channels found)</h2>
              <button
                onClick={handleDownload}
                disabled={downloadLoading || !results}
                className={`px-4 py-2 rounded text-white ${
                  downloadLoading || !results ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {downloadLoading ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((channel, index) => (
                <ChannelCard key={index} channel={channel} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}