import { chromium } from 'playwright';

// Configuration constants
const INITIAL_PAGE_LOAD_DELAY = 3000; // ms
const CONSENT_DIALOG_DELAY = 2000;
const FILTER_LOAD_DELAY = 3000;
const SCROLL_PAUSE_TIME = 2000;
const SCROLL_ATTEMPTS_PER_CHUNK = 2;
const MAX_WAIT_TIME = 10000;
const CHANNEL_PAGE_LOAD_DELAY = 3000;

export async function scrapeYouTubeChannels(searchQuery, maxChannels) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Handle consent dialog
    await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
    await page.waitForTimeout(INITIAL_PAGE_LOAD_DELAY);

    try {
      const consentButton = await page.waitForSelector('button:has-text("Accept all")', { timeout: MAX_WAIT_TIME });
      await consentButton.click();
      await page.waitForTimeout(CONSENT_DIALOG_DELAY);
      console.log("Consent dialog handled");
    } catch (e) {
      console.log("No consent dialog found");
    }

    // Step 2: Apply video filter
    try {
      const filterButton = await page.waitForSelector('button#filter-button', { timeout: MAX_WAIT_TIME });
      await filterButton.click();
      await page.waitForTimeout(1000);
      
      const videoFilter = await page.waitForSelector('ytd-search-filter-group-renderer:has-text("Video") >> text=Video', { timeout: MAX_WAIT_TIME });
      await videoFilter.click();
      await page.waitForTimeout(FILTER_LOAD_DELAY);
      console.log("Video filter applied");
    } catch (e) {
      console.log("Failed to apply video filter:", e);
    }

    // Step 3: Collect channel links
    const channelLinks = new Set();
    let scrollAttempts = 0;
    let lastHeight = await page.evaluate('document.documentElement.scrollHeight');

    while (channelLinks.size < maxChannels && scrollAttempts < 10) {
      // Find all channel links
      const links = await page.$$eval('a[href*="/@"], a[href*="/channel/"]', anchors => 
        anchors.map(a => a.href.split('?')[0])
      );
      
      links.forEach(link => {
        if (channelLinks.size < maxChannels) {
          channelLinks.add(link);
        }
      });

      if (channelLinks.size >= maxChannels) break;

      // Scroll down
      for (let i = 0; i < SCROLL_ATTEMPTS_PER_CHUNK; i++) {
        await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
        await page.waitForTimeout(SCROLL_PAUSE_TIME);
        const newHeight = await page.evaluate('document.documentElement.scrollHeight');
        if (newHeight === lastHeight) break;
        lastHeight = newHeight;
      }
      scrollAttempts++;
    }

    console.log(`Collected ${channelLinks.size} channel links`);

    // Step 4: Get channel details
    const details = [];
    for (const link of Array.from(channelLinks).slice(0, maxChannels)) {
      console.log(`Visiting channel: ${link}`);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(CHANNEL_PAGE_LOAD_DELAY);

        // Initialize defaults
        let nationality = 'Not found';
        let joined_on = 'Not found';
        let subscribers = 'Not found';
        let videos_count = 'Not found';
        let total_views = 'Not found';

        // Try to click "More" button
        try {
          const moreButton = await page.waitForSelector('button:has-text("more")', { timeout: 5000 });
          await moreButton.click();
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log("Couldn't find 'more' button");
        }

        // Try to click "More about" button
        try {
          const moreAboutButton = await page.waitForSelector('button[aria-label*="More about"]', { timeout: 5000 });
          await moreAboutButton.click();
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log("Couldn't find 'More about' button");
        }

        // Extract details
        try {
          const detailsContainer = await page.$('#additional-info-container');
          if (detailsContainer) {
            const rows = await detailsContainer.$$('tr');
            for (const row of rows) {
              const th = await row.$('th');
              const td = await row.$('td');
              if (th && td) {
                const label = await th.textContent();
                const value = await td.textContent();
                
                if (label.includes('Location')) nationality = value;
                else if (label.includes('Joined')) joined_on = value.replace('Joined ', '');
                else if (label.includes('subscribers')) subscribers = value;
                else if (label.includes('videos')) videos_count = value;
                else if (label.includes('views')) total_views = value;
              }
            }
          }
        } catch (e) {
          console.log("Error extracting details:", e);
        }

        details.push({
          channel_url: link,
          nationality,
          joined_on,
          subscribers,
          videos_count,
          total_views
        });
      } catch (e) {
        console.log(`Failed to fetch details for ${link}:`, e);
      }
    }

    return details;
  } finally {
    await browser.close();
  }
}

// import { chromium } from 'playwright';

// // Configuration constants
// const INITIAL_PAGE_LOAD_DELAY = 3000; // ms
// const CONSENT_DIALOG_DELAY = 2000;
// const FILTER_LOAD_DELAY = 3000;
// const SCROLL_PAUSE_TIME = 2000;
// const SCROLL_ATTEMPTS_PER_CHUNK = 2;
// const MAX_WAIT_TIME = 10000;
// const CHANNEL_PAGE_LOAD_DELAY = 3000;

// export async function scrapeYouTubeChannels(searchQuery, maxChannels) {
//   const browser = await chromium.launch({ headless: true });
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   try {
//     // Step 1: Handle consent dialog
//     await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
//     await page.waitForTimeout(INITIAL_PAGE_LOAD_DELAY);

//     try {
//       const consentButton = await page.waitForSelector('button[aria-label*="Accept"]', { timeout: MAX_WAIT_TIME });
//       await consentButton.click();
//       await page.waitForTimeout(CONSENT_DIALOG_DELAY);
//       console.log("Consent dialog handled");
//     } catch (e) {
//       console.log("No consent dialog found");
//     }

//     // Step 2: Apply video filter
//     try {
//       const filterButton = await page.waitForSelector('yt-chip-cloud-chip-renderer:has-text("Videos")', { timeout: MAX_WAIT_TIME });
//       await filterButton.click();
//       await page.waitForTimeout(FILTER_LOAD_DELAY);
//       console.log("Video filter applied");
//     } catch (e) {
//       console.log("Failed to apply video filter:", e);
//     }

//     // Step 3: Collect channel links
//     const channelLinks = new Set();
//     let scrollAttempts = 0;
//     let lastHeight = await page.evaluate('document.documentElement.scrollHeight');

//     while (channelLinks.size < maxChannels && scrollAttempts < 10) {
//       // Find all channel links
//       const links = await page.$$eval('a[href*="/@"], a[href*="/channel/"]', anchors => 
//         anchors.map(a => a.href.split('?')[0])
//       );
      
//       links.forEach(link => {
//         if (channelLinks.size < maxChannels) {
//           channelLinks.add(link);
//         }
//       });

//       if (channelLinks.size >= maxChannels) break;

//       // Scroll down
//       for (let i = 0; i < SCROLL_ATTEMPTS_PER_CHUNK; i++) {
//         await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
//         await page.waitForTimeout(SCROLL_PAUSE_TIME);
//         const newHeight = await page.evaluate('document.documentElement.scrollHeight');
//         if (newHeight === lastHeight) break;
//         lastHeight = newHeight;
//       }
//       scrollAttempts++;
//     }

//     console.log(`Collected ${channelLinks.size} channel links`);

//     // Step 4: Get channel details
//     const details = [];
//     for (const link of Array.from(channelLinks).slice(0, maxChannels)) {
//       console.log(`Visiting channel: ${link}`);
//       try {
//         await page.goto(link, { waitUntil: 'domcontentloaded' });
//         await page.waitForTimeout(CHANNEL_PAGE_LOAD_DELAY);

//         // Mute and pause videos to stabilize page
//         await page.evaluate(() => {
//           const videos = document.querySelectorAll('video');
//           videos.forEach(video => {
//             video.muted = true;
//             video.pause();
//           });
//         });
//         console.log("Muted and paused videos");

//         // Initialize defaults
//         let nationality = 'Not found';
//         let joined_on = 'Not found';
//         let subscribers = 'Not found';
//         let videos_count = 'Not found';
//         let total_views = 'Not found';

//         // Step 1: Click "More" button in channel description
//         try {
//           const moreButton = await page.waitForSelector('button[aria-label*="more"]', { timeout: 5000 });
//           await moreButton.click();
//           await page.waitForTimeout(1000);
//           console.log("Clicked 'More' button to expand channel description");
//         } catch (e) {
//           console.log("Unable to click 'More' button:", e);
//         }

//         // Step 2: Click "More Info" button
//         // try {
//         //   const moreInfoButton = await page.waitForSelector('button[aria-label*="More about"]', { timeout: 5000 });
//         //   await moreInfoButton.click();
//         //   await page.waitForTimeout(1000);
//         //   console.log("Clicked 'More Info' to reveal additional details");
//         // } catch (e) {
//         //   console.log("Unable to click 'More Info' button:", e);
//         // }

//         // Step 3: Extract details using specific XPaths
//         try {
//           // Nationality
//           const nationalityElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[4]/td[2]', { timeout: 5000 });
//           nationality = await nationalityElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No nationality found:", e);
//         }

//         try {
//           // Joined date
//           const joinedElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[5]/td[2]/yt-attributed-string/span/span', { timeout: 5000 });
//           joined_on = (await joinedElement.textContent() || 'Not found').replace('Joined ', '');
//         } catch (e) {
//           console.log("No joined date found:", e);
//         }

//         try {
//           // Subscribers
//           const subscribersElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[6]/td[2]', { timeout: 5000 });
//           subscribers = await subscribersElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No subscribers found:", e);
//         }

//         try {
//           // Video count
//           const videosElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[7]/td[2]', { timeout: 5000 });
//           videos_count = await videosElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No video count found:", e);
//         }

//         try {
//           // Total views
//           const viewsElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[8]/td[2]', { timeout: 5000 });
//           total_views = await viewsElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No total views found:", e);
//         }

//         details.push({
//           channel_url: link,
//           nationality,
//           joined_on,
//           subscribers,
//           videos_count,
//           total_views
//         });
//       } catch (e) {
//         console.log(`Failed to fetch details for ${link}:`, e);
//       }
//     }

//     return details;
//   } finally {
//     await browser.close();
//   }
// }


// import { chromium } from 'playwright';
// import fs from 'fs/promises';
// import path from 'path';
// import { stringify } from 'csv-stringify';

// // Configuration constants
// const INITIAL_PAGE_LOAD_DELAY = 3000; // ms
// const CONSENT_DIALOG_DELAY = 2000;
// const FILTER_LOAD_DELAY = 3000;
// const SCROLL_PAUSE_TIME = 2000;
// const SCROLL_ATTEMPTS_PER_CHUNK = 2;
// const MAX_WAIT_TIME = 10000;
// const CHANNEL_PAGE_LOAD_DELAY = 3000;

// export async function scrapeYouTubeChannels(searchQuery, maxChannels) {
//   const browser = await chromium.launch({ headless: true });
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   try {
//     // Step 1: Handle consent dialog
//     await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
//     await page.waitForTimeout(INITIAL_PAGE_LOAD_DELAY);

//     try {
//       const consentButton = await page.waitForSelector('button[aria-label*="Accept"]', { timeout: MAX_WAIT_TIME });
//       await consentButton.click();
//       await page.waitForTimeout(CONSENT_DIALOG_DELAY);
//       console.log("Consent dialog handled");
//     } catch (e) {
//       console.log("No consent dialog found");
//     }

//     // Step 2: Apply video filter
//     try {
//       const filterButton = await page.waitForSelector('yt-chip-cloud-chip-renderer:has-text("Videos")', { timeout: MAX_WAIT_TIME });
//       await filterButton.click();
//       await page.waitForTimeout(FILTER_LOAD_DELAY);
//       console.log("Video filter applied");
//     } catch (e) {
//       console.log("Failed to apply video filter:", e);
//     }

//     // Step 3: Collect channel links
//     const channelLinks = new Set();
//     let scrollAttempts = 0;
//     let lastHeight = await page.evaluate('document.documentElement.scrollHeight');

//     while (channelLinks.size < maxChannels && scrollAttempts < 10) {
//       const links = await page.$$eval('a[href*="/@"], a[href*="/channel/"]', anchors => 
//         anchors.map(a => a.href.split('?')[0])
//       );
      
//       links.forEach(link => {
//         if (channelLinks.size < maxChannels) {
//           channelLinks.add(link);
//         }
//       });

//       if (channelLinks.size >= maxChannels) break;

//       for (let i = 0; i < SCROLL_ATTEMPTS_PER_CHUNK; i++) {
//         await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
//         await page.waitForTimeout(SCROLL_PAUSE_TIME);
//         const newHeight = await page.evaluate('document.documentElement.scrollHeight');
//         if (newHeight === lastHeight) break;
//         lastHeight = newHeight;
//       }
//       scrollAttempts++;
//     }

//     console.log(`Collected ${channelLinks.size} channel links`);

//     // Step 4: Get channel details
//     const details = [];
//     for (const link of Array.from(channelLinks).slice(0, maxChannels)) {
//       console.log(`Visiting channel: ${link}`);
//       try {
//         await page.goto(link, { waitUntil: 'domcontentloaded' });
//         await page.waitForTimeout(CHANNEL_PAGE_LOAD_DELAY);

//         await page.evaluate(() => {
//           const videos = document.querySelectorAll('video');
//           videos.forEach(video => {
//             video.muted = true;
//             video.pause();
//           });
//         });
//         console.log("Muted and paused videos");

//         let nationality = 'Not found';
//         let joined_on = 'Not found';
//         let subscribers = 'Not found';
//         let videos_count = 'Not found';
//         let total_views = 'Not found';

//         try {
//           const moreButton = await page.waitForSelector('button[aria-label*="more"]', { timeout: 5000 });
//           await moreButton.click();
//           await page.waitForTimeout(1000);
//           console.log("Clicked 'More' button to expand channel description");
//         } catch (e) {
//           console.log("Unable to click 'More' button:", e);
//         }

//         try {
//           const moreInfoButton = await page.waitForSelector('button[aria-label*="More about"]', { timeout: 5000 });
//           await moreInfoButton.click();
//           await page.waitForTimeout(1000);
//           console.log("Clicked 'More Info' to reveal additional details");
//         } catch (e) {
//           console.log("Unable to click 'More Info' button:", e);
//         }

//         try {
//           const nationalityElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[4]/td[2]', { timeout: 5000 });
//           nationality = await nationalityElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No nationality found:", e);
//         }

//         try {
//           const joinedElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[5]/td[2]/yt-attributed-string/span/span', { timeout: 5000 });
//           joined_on = (await joinedElement.textContent() || 'Not found').replace('Joined ', '');
//         } catch (e) {
//           console.log("No joined date found:", e);
//         }

//         try {
//           const subscribersElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[6]/td[2]', { timeout: 5000 });
//           subscribers = await subscribersElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No subscribers found:", e);
//         }

//         try {
//           const videosElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[7]/td[2]', { timeout: 5000 });
//           videos_count = await videosElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No video count found:", e);
//         }

//         try {
//           const viewsElement = await page.waitForSelector('//*[@id="additional-info-container"]/table/tbody/tr[8]/td[2]', { timeout: 5000 });
//           total_views = await viewsElement.textContent() || 'Not found';
//         } catch (e) {
//           console.log("No total views found:", e);
//         }

//         details.push({
//           channel_url: link,
//           nationality,
//           joined_on,
//           subscribers,
//           videos_count,
//           total_views
//         });
//       } catch (e) {
//         console.log(`Failed to fetch details for ${link}:`, e);
//       }
//     }

//     // Step 5: Save channel links to CSV
//     const linksCsvDir = path.join('yt-scraper', 'csvs');
//     await fs.mkdir(linksCsvDir, { recursive: true });
//     const linksCsvContent = await stringify(
//       Array.from(channelLinks).map(url => ({ channel_url: url })),
//       { header: true, columns: ['channel_url'], quoted: true }
//     );
//     await fs.writeFile(path.join(linksCsvDir, 'channel_urls.csv'), '\ufeff' + linksCsvContent, 'utf8');
//     console.log("Channel URLs saved to yt-scraper/csvs/channel_urls.csv");

//     // Step 6: Save channel details to CSV
//     if (details.length > 0) {
//       const headers = ['channel_url', 'nationality', 'joined_on', 'subscribers', 'videos_count', 'total_views'];
//       const detailsCsvContent = await stringify(details, {
//         header: true,
//         columns: headers,
//         quoted: true,
//         quoted_empty: true,
//         record_delimiter: '\n'
//       });
//       await fs.writeFile(path.join(linksCsvDir, 'channel_details.csv'), '\ufeff' + detailsCsvContent, 'utf8');
//       console.log("Channel details saved to yt-scraper/csvs/channel_details.csv");
//     } else {
//       console.log("No channel details collected");
//     }

//     return details;
//   } finally {
//     await browser.close();
//   }
// }