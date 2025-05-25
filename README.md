# YouTube Channel Scraper

This Python script is a web scraper designed to extract information about YouTube channels based on a specific search query. It uses **Selenium** to automate browser interactions, **WebDriver Manager** to handle browser driver setup, and **Pandas** to store and output the collected data.

The scraper navigates to YouTube, applies a video filter, collects channel links from the search results (with scrolling to gather more links), and then visits each channel's "About" page to extract details like nationality, joined date, subscribers, video count, and total views.

---

## Features

* **Automated Browser Control:** Uses Selenium to interact with YouTube via a Chrome browser.
* **Dynamic Content Handling:** Scrolls through search results to find more channel links.
* **Consent Dialog Management:** Attempts to handle YouTube's consent dialog if it appears.
* **Configurable Search:** Easily change the search query to scrape different types of channels.
* **Data Extraction:** Collects key channel metrics such as nationality, joined date, subscribers, video count, and total views.
* **CSV Output:** Saves extracted channel URLs and details into convenient CSV files.
* **Robust Logging:** Provides detailed logs for monitoring script execution and troubleshooting.

---

## Requirements

Before you can run the script, make sure you have the following installed on your system:

* **Python 3.x**
* **Google Chrome browser**

---

## Installation

Follow these steps to get the scraper up and running:

1.  **Clone the repository (or download the script):**
    First, get the code onto your local machine.
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```
    *(Remember to replace `your-username` and `your-repo-name` with your actual GitHub repository details.)*

2.  **Create a virtual environment:**
    It's always a good practice to use a **virtual environment** to manage project dependencies. This keeps your project's libraries separate from your system's global Python installation.
    ```bash
    python3 -m venv venv
    ```

3.  **Activate the virtual environment:**
    You'll need to activate the environment before installing packages or running the script.

    * **macOS / Linux:**
        ```bash
        source venv/bin/activate
        ```
    * **Windows (Command Prompt):**
        ```bash
        .\venv\Scripts\activate.bat
        ```
    * **Windows (PowerShell):**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```

4.  **Install the required Python packages:**
    Once your virtual environment is active, install the necessary libraries using pip.
    ```bash
    pip install selenium pandas webdriver-manager
    ```

---

## Usage

1.  **Configure the Scraper:**
    Open the `scraper.ipynb` file (or your Python script if you've converted it to a `.py` file) in a text editor or Jupyter Notebook. Locate the **`Configuration Constants`** section at the top of the file. Here, you can adjust the scraper's behavior:

    ```python
    # --- Configuration Constants ---
    SEARCH_QUERY = "tech reviews 2025" # Change this to your desired search query (e.g., "cooking channels", "gaming setup guides")
    MIN_CHANNEL_LINKS = 3              # Minimum number of unique channel links to attempt to collect
    MAX_CHANNEL_LINKS = 3              # Maximum number of unique channel links to collect. The script will stop scrolling once this is reached.

    # You can also fine-tune delay times and other parameters:
    INITIAL_PAGE_LOAD_DELAY = 3        # seconds for the initial YouTube page load
    CONSENT_DIALOG_DELAY = 2           # seconds to wait after handling consent dialog
    FILTER_LOAD_DELAY = 3              # seconds to wait after applying the video filter
    SCROLL_PAUSE_TIME = 2              # seconds to pause after each scroll attempt
    SCROLL_ATTEMPTS_PER_CHUNK = 2      # How many times to scroll in one go during link collection
    MAX_WAIT_TIME = 10                 # Maximum seconds for WebDriverWait to find an element
    CHANNEL_PAGE_LOAD_DELAY = 3        # seconds to wait for a channel's "About" page to load
    ```

2.  **Run the script:**

    If you're using a Python script:
    ```bash
    python scraper.py # Assuming you saved it as scraper.py
    ```
    If you're using **Jupyter Notebook**:
    Open the `scraper.ipynb` file in your Jupyter environment and run all the cells.

    A Chrome browser window will automatically open, navigate to YouTube, perform the search, and then proceed to collect the data. You'll see real-time logging messages in your terminal (or Jupyter output) indicating the script's progress and any encountered issues.

---

## Output

The script will organize its output neatly for you. It will create a directory named `csvs` in the root of your project if it doesn't already exist. Inside `csvs`, you'll find two CSV files:

* `channel_urls.csv`: A simple list of all the unique YouTube channel URLs discovered during the search and collection phase.
* `channel_details.csv`: A more detailed record, containing comprehensive information for each scraped channel. This includes:
    * `channel_url`
    * `nationality`
    * `joined_on`
    * `subscribers`
    * `videos_count`
    * `total_views`

---

## Troubleshooting

Encountering issues? Here are some common problems and their solutions:

* **`WebDriverException: Message: 'chromedriver' executable needs to be in PATH`**: This usually means `webdriver-manager` had trouble downloading or locating the Chrome driver.
    * Ensure you have a stable internet connection.
    * Verify that Google Chrome is correctly installed on your system.
    * Sometimes, antivirus software can interfere with the driver download; temporarily disable it if you suspect this is the cause.
* **Consent Dialog Issues**: YouTube frequently updates its user interface, including consent dialogs. If the script gets stuck or fails at the consent page, the XPath for the consent button might have changed.
    * Inspect the YouTube page elements using your browser's developer tools to find the new XPath for the "Accept" or "Agree" button.
    * Adjust the XPath in the `handleConsentDialog` function accordingly.
* **Element Not Found / Stale Element Reference**: Web pages are dynamic, and elements might not load immediately or might change positions. This can lead to Selenium failing to find an element.
    * **Increase wait times:** Try increasing `MAX_WAIT_TIME` or other specific delay constants (e.g., `INITIAL_PAGE_LOAD_DELAY`, `FILTER_LOAD_DELAY`, `CHANNEL_PAGE_LOAD_DELAY`).
    * **Verify XPaths:** Carefully re-check the XPaths used in `MapsAndApplyVideoFilter`, `collectUniqueChannelLinks`, and `getChannelDetails` against the current YouTube page structure. YouTube's HTML can change over time.
* **Too Few Channel Links Collected**: If the `MIN_CHANNEL_LINKS` target isn't met, the scraper might not be scrolling effectively or your search query might not yield enough results.
    * Try increasing `SCROLL_ATTEMPTS_PER_CHUNK` to scroll more times in a single batch.
    * Increase `SCROLL_PAUSE_TIME` to give the page more time to load new content after each scroll.
    * Consider adjusting your `SEARCH_QUERY` to a broader or different topic that might have more results.
* **"Not found" values in CSV for channel details**: This means the scraper couldn't locate specific information like nationality, subscribers, etc., on a channel's "About" page.
    * This often happens if the XPaths used to find these details are outdated due to YouTube UI changes.
    * The information might also simply not be available on all channel "About" pages (e.g., some channels don't publicly list their nationality).
    * Inspect the channel "About" page elements to find the correct XPaths and update them in the `getChannelDetails` function.

---
