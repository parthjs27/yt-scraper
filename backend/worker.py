# worker.py (root level)
from app.scraper import run_scraper
from app.redis_queue import dequeue_scrape_task
import time

while True:
    task = dequeue_scrape_task()
    if task:
        print(f"Processing task: {task}")
        run_scraper(task["search_query"], task["max_channel_links"])
    else:
        time.sleep(5)
