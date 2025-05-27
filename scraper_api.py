from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import time
import pandas as pd
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
import stat
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# --- Configuration Constants ---
INITIAL_PAGE_LOAD_DELAY = 3
CONSENT_DIALOG_DELAY = 2
FILTER_LOAD_DELAY = 3
SCROLL_PAUSE_TIME = 2
SCROLL_ATTEMPTS_PER_CHUNK = 2
MAX_WAIT_TIME = 10
MIN_CHANNEL_LINKS = 3
CHANNEL_PAGE_LOAD_DELAY = 3

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ScrapeRequest(BaseModel):
    search_query: str
    max_channel_links: int = 3

def handleConsentDialog(driver):
    try:
        consent_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "Accept")]'))
        )
        consent_button.click()
        time.sleep(CONSENT_DIALOG_DELAY)
    except Exception as e:
        logging.warning(f"Consent dialog not handled: {e}")

def navigateAndApplyVideoFilter(driver, query):
    driver.get(f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}")
    time.sleep(INITIAL_PAGE_LOAD_DELAY)
    try:
        filter_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, '//yt-chip-cloud-chip-renderer//*[contains(text(), "Videos")]'))
        )
        filter_button.click()
        time.sleep(FILTER_LOAD_DELAY)
    except Exception as e:
        logging.error(f"Video filter not applied: {e}")

def collectUniqueChannelLinks(driver, max_channel_links):
    links = set()
    attempts = 0
    last_height = driver.execute_script("return document.documentElement.scrollHeight")
    while len(links) < MIN_CHANNEL_LINKS and attempts < 10:
        try:
            videos = WebDriverWait(driver, MAX_WAIT_TIME).until(
                EC.presence_of_all_elements_located((By.XPATH, '//ytd-video-renderer//a[@href and (contains(@href, "/@") or contains(@href, "/channel/"))]'))
            )
            for video in videos:
                href = video.get_attribute("href")
                if "/@" in href or "/channel/" in href:
                    links.add(href)
                if len(links) >= max_channel_links:
                    break
            for _ in range(SCROLL_ATTEMPTS_PER_CHUNK):
                driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(SCROLL_PAUSE_TIME)
                new_height = driver.execute_script("return document.documentElement.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
            attempts += 1
        except Exception as e:
            logging.error(f"Error collecting links: {e}")
            break
    return list(links)[:max_channel_links]

def getChannelDetails(driver, links):
    data = []
    for url in links:
        driver.get(url)
        time.sleep(CHANNEL_PAGE_LOAD_DELAY)
        driver.execute_script("""
            var videos = document.querySelectorAll('video');
            videos.forEach(v => { v.muted = true; v.pause(); });
        """)
        nationality = joined_on = subscribers = videos_count = total_views = "Not found"
        try:
            more_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "more") or contains(@aria-label, "more")]'))
            )
            more_button.click()
            time.sleep(1)
        except:
            pass
        try:
            info_button = WebDriverWait(driver, MAX_WAIT_TIME).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(@aria-label, "More about")]'))
            )
            info_button.click()
            time.sleep(1)
        except:
            pass
        try:
            nationality = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[4]/td[2]').text
        except:
            pass
        try:
            joined_on = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[5]/td[2]/yt-attributed-string/span/span').text.replace("Joined ", "")
        except:
            pass
        try:
            subscribers = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[6]/td[2]').text
        except:
            pass
        try:
            videos_count = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[7]/td[2]').text
        except:
            pass
        try:
            total_views = driver.find_element(By.XPATH, '//*[@id="additional-info-container"]/table/tbody/tr[8]/td[2]').text
        except:
            pass
        data.append({
            'channel_url': url,
            'nationality': nationality,
            'joined_on': joined_on,
            'subscribers': subscribers,
            'videos_count': videos_count,
            'total_views': total_views
        })
    return data

def run_scraper(search_query: str, max_channel_links: int):
    try:
        logging.info("Starting scraper...")
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Use a more direct approach to initialize ChromeDriver
        driver_path = ChromeDriverManager().install()
        # Ensure we're using the actual chromedriver executable, not the THIRD_PARTY_NOTICES file
        if 'THIRD_PARTY_NOTICES' in driver_path:
            driver_path = driver_path.replace('THIRD_PARTY_NOTICES.chromedriver', 'chromedriver')
        
        # Set executable permissions for ChromeDriver
        os.chmod(driver_path, stat.S_IXUSR | stat.S_IWUSR | stat.S_IRUSR)
        
        service = ChromeService(executable_path=driver_path)
        with webdriver.Chrome(service=service, options=chrome_options) as driver:
            logging.info("Chrome driver initialized")
            driver.maximize_window()
            
            logging.info("Handling consent dialog...")
            handleConsentDialog(driver)
            
            logging.info(f"Navigating to search results for: {search_query}")
            navigateAndApplyVideoFilter(driver, search_query)
            
            logging.info("Collecting channel links...")
            links = collectUniqueChannelLinks(driver, max_channel_links)
            logging.info(f"Found {len(links)} channel links")
            
            logging.info("Getting channel details...")
            details = getChannelDetails(driver, links)
            logging.info(f"Collected details for {len(details)} channels")

            logging.info("Creating csvs directory...")
            os.makedirs('csvs', exist_ok=True)
            
            logging.info("Saving channel URLs...")
            pd.DataFrame(links, columns=['channel_url']).to_csv('csvs/channel_urls.csv', index=False)
            
            logging.info("Saving channel details...")
            pd.DataFrame(details).to_csv('csvs/channel_details.csv', index=False)
            
            logging.info("Scraping completed successfully")
            return True
    except Exception as e:
        logging.error(f"Error in run_scraper: {str(e)}", exc_info=True)
        raise

@app.post("/scrape")
def scrape(request: ScrapeRequest):
    try:
        run_scraper(request.search_query, request.max_channel_links)
        return {"status": "success", "message": "Scraping completed."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/download/{filename}")
def download_csv(filename: str):
    path = f"csvs/{filename}"
    if os.path.exists(path):
        return FileResponse(path=path, filename=filename)
    return {"error": "File not found"}

@app.post("/scrape_data")
def scrape_data(request: ScrapeRequest):
    try:
        run_scraper(request.search_query, request.max_channel_links)
        # Read both CSVs
        urls = pd.read_csv('csvs/channel_urls.csv')
        details = pd.read_csv('csvs/channel_details.csv')
        return JSONResponse(content={
            "status": "success",
            "channel_urls": urls.to_dict(orient="records"),
            "channel_details": details.to_dict(orient="records")
        })
    except Exception as e:
        return JSONResponse(content={
            "status": "error",
            "message": str(e)
        })

if __name__ == "__main__":
    uvicorn.run("scraper_api:app", host="127.0.0.1", port=8000, reload=True) 