// import { scrapeYouTubeChannels } from '@/lib/scrape';

// export async function POST(request) {
//   try {
//     const { searchQuery, maxChannels } = await request.json();
    
//     if (!searchQuery || typeof searchQuery !== 'string') {
//       return new Response(JSON.stringify({ error: 'Invalid search query' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const max = Math.min(parseInt(maxChannels) || 3, 10);
//     const results = await scrapeYouTubeChannels(searchQuery, max);

//     return new Response(JSON.stringify(results), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (error) {
//     console.error('Scraping error:', error);
//     return new Response(JSON.stringify({ error: 'Scraping failed' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

// import { scrapeYouTubeChannels } from '@/lib/scrape';
// import fs from 'fs/promises';
// import path from 'path';

// export async function POST(request) {
//   try {
//     const { searchQuery, maxChannels } = await request.json();

//     if (!searchQuery || typeof searchQuery !== 'string') {
//       return new Response(JSON.stringify({ error: 'Invalid search query' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const max = Math.min(parseInt(maxChannels) || 3, 10);
//     const results = await scrapeYouTubeChannels(searchQuery, max);

//     // Read the generated CSV file
//     const csvPath = path.join(process.cwd(), 'yt-scraper', 'csvs', 'channel_details.csv');
//     try {
//       const fileContent = await fs.readFile(csvPath);

//       // Set headers for CSV download
//       return new Response(fileContent, {
//         status: 200,
//         headers: {
//           'Content-Type': 'text/csv',
//           'Content-Disposition': 'attachment; filename=channel_details.csv',
//         },
//       });
//     } catch (fileError) {
//       console.error('Error reading CSV file:', fileError);
//       // Fallback to JSON response if CSV fails
//       return new Response(JSON.stringify(results), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }
//   } catch (error) {
//     console.error('Scraping error:', error);
//     return new Response(JSON.stringify({ error: 'Scraping failed' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

// import { scrapeYouTubeChannels } from '@/lib/scrape';
// import fs from 'fs/promises';
// import path from 'path';

// export async function POST(request) {
//   try {
//     const { searchQuery, maxChannels } = await request.json();

//     if (!searchQuery || typeof searchQuery !== 'string') {
//       return new Response(JSON.stringify({ error: 'Invalid search query' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const max = Math.min(parseInt(maxChannels) || 3, 10);
//     const results = await scrapeYouTubeChannels(searchQuery, max);

//     // Check if client explicitly requests JSON
//     const requestType = request.headers.get('x-request-type');
//     if (requestType === 'json') {
//       return new Response(JSON.stringify(results.map(result => ({ ...result, searchQuery }))), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     // Default: Serve CSV
//     const csvPath = path.join(process.cwd(), 'yt-scraper', 'csvs', 'channel_details.csv');
//     try {
//       const fileContent = await fs.readFile(csvPath);
//       return new Response(fileContent, {
//         status: 200,
//         headers: {
//           'Content-Type': 'text/csv',
//           'Content-Disposition': 'attachment; filename=channel_details.csv',
//         },
//       });
//     } catch (fileError) {
//       console.error('Error reading CSV file:', fileError);
//       return new Response(JSON.stringify(results.map(result => ({ ...result, searchQuery }))), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }
//   } catch (error) {
//     console.error('Scraping error:', error);
//     return new Response(JSON.stringify({ error: 'Scraping failed' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

import { scrapeYouTubeChannels } from '@/lib/scrape';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { searchQuery, maxChannels } = await request.json();

    if (!searchQuery || typeof searchQuery !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid search query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const max = Math.min(parseInt(maxChannels) || 3, 10);
    const results = await scrapeYouTubeChannels(searchQuery, max);

    // Check if client explicitly requests JSON
    const requestType = request.headers.get('x-request-type');
    if (requestType === 'json') {
      return new Response(JSON.stringify(results.map(result => ({ ...result, searchQuery }))), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serve CSV
    const csvPath = path.join(process.cwd(), 'yt-scraper', 'csvs', 'channel_details.csv');
    const fileContent = await fs.readFile(csvPath);
    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=channel_details.csv',
      },
    });
  } catch (error) {
    console.error('Scraping or file error:', error);
    return new Response(JSON.stringify({ error: 'Failed to scrape or serve CSV' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}