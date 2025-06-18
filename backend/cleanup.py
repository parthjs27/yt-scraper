# backend/cleanup.py
#!/usr/bin/env python3

import os
import time
import logging
import fcntl

LOG_FILE_PATH = '/home/ubuntu/cleanup_csvs.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - CLEANUP - %(message)s',
    handlers=[logging.FileHandler(LOG_FILE_PATH)]
)

logger = logging.getLogger(__name__)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(SCRIPT_DIR, 'csvs')
LOCK_FILE = os.path.join(SCRIPT_DIR, 'cleanup.lock')

RETENTION_MINUTES = 5

def cleanup_old_csvs():
    lock_fd = open(LOCK_FILE, 'w')
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except IOError:
        logger.info("Another instance is running. Exiting.")
        return

    try:
        logger.info(f"Starting cleanup for directory: {CSV_DIR}")
        if not os.path.exists(CSV_DIR):
            logger.warning(f"CSV directory '{CSV_DIR}' does not exist. Skipping cleanup.")
            return

        if not os.path.isdir(CSV_DIR):
            logger.error(f"'{CSV_DIR}' exists but is not a directory. Cannot perform cleanup.")
            return

        now = time.time()
        logger.info(f"Current time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now))}")
        cutoff_time = now - (RETENTION_MINUTES * 60)
        logger.info(f"Cutoff time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cutoff_time))}")

        deleted_count = 0
        all_files = os.listdir(CSV_DIR)
        logger.info(f"Files in directory: {all_files}")
        for filename in all_files:
            filepath = os.path.join(CSV_DIR, filename)
            logger.info(f"Processing: {filepath}, Is file: {os.path.isfile(filepath)}, Ends with .csv: {filename.endswith('.csv')}")
            if os.path.isfile(filepath) and filename.endswith('.csv'):
                try:
                    file_mtime = os.path.getmtime(filepath)
                    logger.info(f"File: {filename}, Modification time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(file_mtime))}")
                    if file_mtime < cutoff_time:
                        os.remove(filepath)
                        logger.info(f"Deleted old CSV file: {filepath}")
                        deleted_count += 1
                    else:
                        logger.info(f"File {filename} is not old enough to delete.")
                except Exception as e:
                    logger.error(f"Error processing or deleting file {filepath}: {e}")
            else:
                logger.info(f"Skipping {filename}: Not a CSV file or not a file.")
        logger.info(f"Cleanup complete. Deleted {deleted_count} old CSV files.")
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        lock_fd.close()

if __name__ == "__main__":
    cleanup_old_csvs()