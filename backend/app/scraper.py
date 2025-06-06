#!/usr/bin/env python3

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

# --- Config Constants ---
INITIAL_PAGE_LOAD_DELAY = 3
CONSENT_DIALOG_DELAY = 2
FILTER_LOAD_DELAY = 3
SCROLL_PAUSE_TIME = 2
SCROLL_ATTEMPTS_PER_CHUNK = 2
MAX_WAIT_TIME = 10
CHANNEL_PAGE_LOAD_DELAY = 3

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def initializeWebDriver():
    logger.info("Initializing WebDriver for Linux environment...")
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920x1080')
    chrome_options.add_argument('--mute-audio')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-infobars')
    chrome_options.add_argument('--remote-debugging-port=9222')

    driver = webdriver.Chrome(
        service=ChromeService(ChromeDriverManager().install()),
        options=chrome_options
    )
    return driver

def closeWebDriver(driver):
    logger.info("Closing WebDriver...")
    driver.quit()

def handleConsentDialogue(driver, MAX_WAIT_TIME):
    logger.info("Handling consent dialogue (if present)...")
    try:
        consent_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "Accept")]'))
        )
        consent_button.click()
        time.sleep(CONSENT_DIALOG_DELAY)
        logger.info("Consent dialog handled.")
    except Exception as e:
        logger.warning(f'Consent dialog not found or failed: {e}')

def navigateAndApplyVideoFilter(driver, search_query, MAX_WAIT_TIME):
    logger.info(f"Navigating to YouTube and searching: {search_query}")
    driver.get(f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}")
    time.sleep(INITIAL_PAGE_LOAD_DELAY)
    try:
        filter_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, '//yt-chip-cloud-chip-renderer//*[contains(text(), "Videos")]'))
        )
        filter_button.click()
        time.sleep(FILTER_LOAD_DELAY)
        logger.info("Video filter applied.")
    except Exception as e:
        logger.warning(f"Failed to apply video filter: {e}")

def collectUniqueChannelLinks(driver, min_links, max_links):
    logger.info(f"Collecting unique channel links (min: {min_links}, max: {max_links})...")
    channel_links = set()
    scroll_attempts = 0
    last_height = driver.execute_script("return document.documentElement.scrollHeight")
    while len(channel_links) < min_links and scroll_attempts < 10:
        try:
            videos = WebDriverWait(driver, MAX_WAIT_TIME).until(
                EC.presence_of_all_elements_located((By.XPATH, '//ytd-video-renderer//a[@href and (contains(@href, "/@") or contains(@href, "/channel/"))]'))
            )
            for video in videos:
                href = video.get_attribute("href")
                if "/@" in href or "/channel/" in href:
                    channel_links.add(href)
                if len(channel_links) >= max_links:
                    break
            for _ in range(SCROLL_ATTEMPTS_PER_CHUNK):
                driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(SCROLL_PAUSE_TIME)
                new_height = driver.execute_script("return document.documentElement.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
            scroll_attempts += 1
        except Exception as e:
            logger.error(f"Error collecting channel links: {e}")
    logger.info(f"Collected {len(channel_links)} channel links.")
    return list(channel_links)[:max_links]

def getChannelDetails(driver, channel_links, CHANNEL_PAGE_LOAD_DELAY):
    logger.info(f"Extracting channel details for {len(channel_links)} links...")
    data = []
    for channel_link in channel_links:
        try:
            logger.info(f"Visiting: {channel_link}")
            driver.get(channel_link)
            time.sleep(CHANNEL_PAGE_LOAD_DELAY)

            driver.execute_script("""
                var videos = document.querySelectorAll('video');
                videos.forEach(function(video){
                    video.muted = true;
                    video.pause();    
                });
            """)

            nationality = joined_on = subscribers = videos_count = total_views = "Not found"

            try:
                more_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "more") or contains(@aria-label, "more")]'))
                )
                more_button.click()
                time.sleep(1)
            except Exception as e:
                logger.warning(f"More button not found: {e}")

            try:
                more_info_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "More about")]'))
                )
                more_info_button.click()
                time.sleep(1)
            except Exception as e:
                logger.warning(f"More info button not found: {e}")

            try:
                nationality = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[4]/td[2]').text
            except Exception as e:
                logger.warning(f"Nationality not found: {e}")
            try:
                joined_on = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[5]/td[2]/yt-attributed-string/span/span').text.replace("Joined ", "")
            except Exception as e:
                logger.warning(f"Join date not found: {e}")
            try:
                subscribers = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[6]/td[2]').text
            except Exception as e:
                logger.warning(f"Subscribers not found: {e}")
            try:
                videos_count = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[7]/td[2]').text
            except Exception as e:
                logger.warning(f"Videos count not found: {e}")
            try:
                total_views = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[8]/td[2]').text
            except Exception as e:
                logger.warning(f"Total views not found: {e}")
            
            data.append({
                'channel_url': channel_link,
                'nationality': nationality,
                'joined_on': joined_on,
                'subscribers': subscribers,
                'videos_count': videos_count,
                'total_views': total_views
            })
        except Exception as e:
            logger.error(f"Failed to fetch channel details: {e}")
            continue
    logger.info("Channel details collection complete.")
    return data

def run_scraper(search_query="tech reviews 2025", min_links=3, max_links=3):
    logger.info(f"Running scraper for query: {search_query}")
    driver = initializeWebDriver()
    try:
        handleConsentDialogue(driver, MAX_WAIT_TIME)
        navigateAndApplyVideoFilter(driver, search_query, MAX_WAIT_TIME)
        channel_links = collectUniqueChannelLinks(driver, min_links, max_links)
        details = getChannelDetails(driver, channel_links, CHANNEL_PAGE_LOAD_DELAY)

        os.makedirs('csvs', exist_ok=True)
        urls_path = 'csvs/channel_urls.csv'
        details_path = 'csvs/channel_details.csv'
        pd.DataFrame(channel_links, columns=['channel_url']).to_csv(urls_path, index=False)
        pd.DataFrame(details).to_csv(details_path, index=False)

        logger.info("Scraping completed. Files saved.")
        return {
            "channel_urls_path": urls_path,
            "channel_details_path": details_path,
            "channel_count": len(channel_links),
        }
    finally:
        closeWebDriver(driver)

if __name__ == "__main__":
    run_scraper()
