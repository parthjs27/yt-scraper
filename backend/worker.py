# worker.py
from app.scraper import run_scraper
from app.redis_queue import dequeue_scrape_task
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - WORKER - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

while True:
    task = dequeue_scrape_task()
    if task:
        job_id = task.get("job_id", "default_job_id_if_missing") # Get job_id
        logger.info(f"Processing job_id: {job_id}  task: {task['search_query']} (Max Links: {task['max_channel_links']})")
        try:
            # Explicitly pass max_links from the task,
            # and let min_links use its default from run_scraper
            run_scraper(search_query=task["search_query"], max_links=task["max_channel_links"], job_id = job_id)
            logger.info(f"Task completed successfully for query: job_id: {job_id} {task['search_query']}")
        except Exception as e:
            logger.error(f"Error processing task for query '{task['search_query']}': {e}", exc_info=True)
    else:
        logger.debug("No tasks in queue. Waiting...")
        time.sleep(5)