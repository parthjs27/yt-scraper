from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
import time
import pandas as pd
import logging
import os

# --- Configuration Constants ---
INITIAL_PAGE_LOAD_DELAY = 3  # seconds
CONSENT_DIALOG_DELAY = 2     # seconds
FILTER_LOAD_DELAY = 3        # seconds
SCROLL_PAUSE_TIME = 2        # seconds
SCROLL_ATTEMPTS_PER_CHUNK = 2 # How many times to scroll in one go
MAX_WAIT_TIME = 10           # seconds for WebDriverWait
MIN_CHANNEL_LINKS = 3
MAX_CHANNEL_LINKS = 3
CHANNEL_PAGE_LOAD_DELAY = 3
SEARCH_QUERY = "tech reviews 2025"

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def initializeWebDriver():
    """
    Initializes and returns a Chrome WebDriver instance.
    Maximizes the browser window.
    """
    logging.info("Initializing WebDriver...")
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()))
    driver.maximize_window()
    return driver

def closeWebDriver(driver):
    """
    Closes the WebDriver.
    """
    logging.info("Closing WebDriver...")
    driver.quit()

def handleConsentDialog(driver, max_wait_time):
    """
    Handles the YouTube consent dialog if it appears.
    """
    logging.info("Checking for consent dialog...")
    try:
        # Wait for the consent button (e.g., "Accept All") and click it
        consent_button = WebDriverWait(driver, max_wait_time).until(
            EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "Accept")]'))
        )
        consent_button.click()
        time.sleep(CONSENT_DIALOG_DELAY)
        logging.info("Consent dialog handled.")
    except Exception as e:
        logging.warning(f"No consent dialog found or error: {e}")

def navigateAndApplyVideoFilter(driver, search_query, max_wait_time):
    """
    Navigates to YouTube search results and applies the video filter.
    """
    logging.info(f"Navigating to YouTube search for: {search_query}")
    driver.get(f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}")
    time.sleep(INITIAL_PAGE_LOAD_DELAY)
    
    try:
        # Click the filter button to show filter options
        filter_button = WebDriverWait(driver, max_wait_time).until(
            EC.element_to_be_clickable((By.XPATH, '//yt-chip-cloud-chip-renderer//*[contains(text(), "Videos")]'))
        )
        filter_button.click()
        time.sleep(FILTER_LOAD_DELAY)
        logging.info("Video filter applied.")
    except Exception as e:
        logging.error(f"Failed to apply video filter: {e}")

def collectUniqueChannelLinks(driver, min_links, max_links):
    """
    Collects unique channel links from search results by scrolling.
    """
    logging.info("Collecting unique channel links...")
    channel_links = set()
    scroll_attempts = 0
    last_height = driver.execute_script("return document.documentElement.scrollHeight")

    while len(channel_links) < min_links and scroll_attempts < 10:  # Limit total scroll attempts
        try:
            # Find channel links in search results
            videos = WebDriverWait(driver, MAX_WAIT_TIME).until(
                EC.presence_of_all_elements_located((By.XPATH, '//ytd-video-renderer//a[@href and contains(@href, "/@") or contains(@href, "/channel/")]'))
            )
            for video in videos:
                href = video.get_attribute("href")
                # Extract channel URL from video page
                if "/@" in href or "/channel/" in href:
                    channel_links.add(href)
                if len(channel_links) >= max_links:
                    break
            if len(channel_links) >= max_links:
                break

            # Scroll down to load more results
            for _ in range(SCROLL_ATTEMPTS_PER_CHUNK):
                driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(SCROLL_PAUSE_TIME)
                new_height = driver.execute_script("return document.documentElement.scrollHeight")
                if new_height == last_height:
                    break  # No more content to load
                last_height = new_height
            scroll_attempts += 1
        except Exception as e:
            logging.error(f"Error collecting channel links: {e}")
            break

    logging.info(f"Collected {len(channel_links)} unique channel links.")
    return list(channel_links)[:max_links]

# def getChannelDetails(driver, channel_links, channel_page_load_delay, max_wait_time):
#     """
#     Extracts details from each channel page.
#     """
#     data = []
#     for channel_link in channel_links:
#         logging.info(f"Visiting channel: {channel_link}")
#         try:
#             driver.get(channel_link)
#             time.sleep(channel_page_load_delay)

#             # Initialize defaults
#             nationality = joined_on = subscribers = videos_count = total_views = "Not found"

#             # Click "More" to reveal additional info
#             try:
#                 click_more = WebDriverWait(driver, max_wait_time).until(
#                     EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "More about")]'))
#                 )
#                 click_more.click()
#             except Exception as e:
#                 logging.warning(f"Unable to click 'More': {e}")

#             # Get nationality
#             try:
#                 nationality = driver.find_element(By.XPATH, '//table//tr[contains(td, "Location")]/td[2]').text
#             except Exception:
#                 logging.warning("No nationality found.")

#             # Get joined date
#             try:
#                 joined_on = driver.find_element(By.XPATH, '//table//tr[contains(td, "Joined")]/td[2]//span').text
#             except Exception:
#                 logging.warning("No joined date found.")

#             # Get subscribers
#             try:
#                 subscribers = driver.find_element(By.XPATH, '//table//tr[contains(td, "subscribers")]/td[2]').text
#             except Exception:
#                 logging.warning("No subscribers found.")

#             # Get video count
#             try:
#                 videos_count = driver.find_element(By.XPATH, '//table//tr[contains(td, "videos")]/td[2]').text
#             except Exception:
#                 logging.warning("No video count found.")

#             # Get total views
#             try:
#                 total_views = driver.find_element(By.XPATH, '//table//tr[contains(td, "views")]/td[2]').text
#             except Exception:
#                 logging.warning("No total views found.")

#             # Append data
#             data.append({
#                 'channel_url': channel_link,
#                 'nationality': nationality,
#                 'joined_on': joined_on,
#                 'subscribers': subscribers,
#                 'videos_count': videos_count,
#                 'total_views': total_views
#             })
#         except Exception as e:
#             logging.error(f"Failed to fetch details for {channel_link}: {e}")
#     return data

def getChannelDetails(driver, channel_links, channel_page_load_delay, max_wait_time):
    """
    Extracts details from each channel page after clicking the 'More' button.
    """
    data = []
    for channel_link in channel_links:
        print(f'Visiting channel: {channel_link}')
        try:
            driver.get(channel_link)
            time.sleep(channel_page_load_delay)

            driver.execute_script("""
                var videos = document.querySelectorAll('video');
                videos.forEach(function(video) {
                    video.muted = true;
                    video.pause();
                });
            """)

            # Initialize default values
            nationality = joined_on = subscribers = videos_count = total_views = "Not found"

            # Step 1: Click the "More" button in the channel description
            try:
                more_button = WebDriverWait(driver, max_wait_time).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "more") or contains(@aria-label, "more")]'))
                )
                more_button.click()
                time.sleep(1)  # Small delay to allow the section to expand
                print("Clicked 'More' button to expand channel description.")
            except Exception as e:
                print(f"Unable to click 'More' button: {e}")

            # Step 2: Click the "More Info" button to reveal additional details (if needed)
            try:
                more_info_button = WebDriverWait(driver, max_wait_time).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "More about")]'))
                )
                more_info_button.click()
                time.sleep(1)  # Small delay to allow the section to expand
                print("Clicked 'More Info' to reveal additional details.")
            except Exception as e:
                print(f"Unable to click 'More Info' button: {e}")

            # Step 3: Extract the data
            # Get nationality
            try:
                nationality = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[4]/td[2]').text
            except Exception:
                print("No nationality found.")

            # Get joined date
            try:
                joined_on = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[5]/td[2]/yt-attributed-string/span/span').text.replace("Joined ", "")
            except Exception:
                print("No joined date found.")

            # Get subscribers
            try:
                subscribers = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[6]/td[2]').text
            except Exception:
                print("No subscribers found.")

            # Get video count
            try:
                videos_count = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[7]/td[2]').text
            except Exception:
                print("No video count found.")

            # Get total views
            try:
                total_views = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[8]/td[2]').text
            except Exception:
                print("No total views found.")

            # Append the data
            data.append({
                'channel_url': channel_link,
                'nationality': nationality,
                'joined_on': joined_on,
                'subscribers': subscribers,
                'videos_count': videos_count,
                'total_views': total_views
            })
        except Exception as e:
            print(f"Failed to fetch details for {channel_link}: {e}")
    return data

# --- Main Execution Block ---
if __name__ == '__main__':
    # Use context manager to ensure WebDriver is closed
    with webdriver.Chrome(service=ChromeService(ChromeDriverManager().install())) as driver:
        driver.maximize_window()
        try:
            # Step 1: Handle consent dialog
            handleConsentDialog(driver, MAX_WAIT_TIME)

            # Step 2: Navigate to search results and apply video filter
            navigateAndApplyVideoFilter(driver, SEARCH_QUERY, MAX_WAIT_TIME)

            # Step 3: Collect unique channel links
            channel_links = collectUniqueChannelLinks(driver, MIN_CHANNEL_LINKS, MAX_CHANNEL_LINKS)

            # Step 4: Get channel details
            details = getChannelDetails(driver, channel_links, CHANNEL_PAGE_LOAD_DELAY, MAX_WAIT_TIME)

            os.makedirs('yt-scraper/csvs', exist_ok=True)
            # Step 5: Output results
            if channel_links:
                logging.info("\n--- Channel URLs ---")
                records = pd.DataFrame(channel_links, columns=['channel_url'])
                logging.info(f"\n{records}")
                records.to_csv('csvs/channel_urls.csv', index=False, encoding='utf-8')
                logging.info("Channel URLs saved to channel_urls.csv")

            if details:
                logging.info("\n--- Channel Details ---")
                record_details = pd.DataFrame(details)
                logging.info(f"\n{record_details}")
                record_details.to_csv('csvs/channel_details.csv', index=False, encoding='utf-8')
                logging.info("Channel details saved to channel_details.csv")
            else:
                logging.warning("No channel details collected.")
        except Exception as e:
            logging.error(f"An error occurred: {e}")