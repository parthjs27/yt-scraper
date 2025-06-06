# app/redis_queue.py
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def enqueue_scrape_task(query, max_links):
    job = {
        "search_query": query,
        "max_channel_links": max_links
    }
    r.lpush("scrape_queue", json.dumps(job))

def dequeue_scrape_task():
    job_data = r.rpop("scrape_queue")
    return json.loads(job_data) if job_data else None
