# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import os
import pandas as pd
from .scraper import run_scraper
from app.redis_queue import enqueue_scrape_task
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    search_query: str
    max_channel_links: int = 3

@app.post("/scrape")
def enqueue_scrape(request: ScrapeRequest):
    job_id = str(uuid.uuid4())
    enqueue_scrape_task(request.search_query, request.max_channel_links,job_id)
    return {"status": "queued", "message": "Scrape job added to queue.", "job_id": job_id}

'''
@app.get("/download/{filename}")
def download_csv(filename: str):
    filepath = f"csvs/{filename}"
    if os.path.exists(filepath):
        return FileResponse(path=filepath, filename=filename)
    return {"error": "File not found"}

@app.get("/data")
def get_scraped_data():
    try:
        urls = pd.read_csv("csvs/channel_urls.csv").to_dict(orient="records")
        details = pd.read_csv("csvs/channel_details.csv").to_dict(orient="records")
        return {"channel_urls": urls, "channel_details": details}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
'''

@app.get("/data/{job_id}") # Now requires a job_id
def get_scraped_data(job_id: str):
    try:
        urls_filepath = f"csvs/{job_id}_channel_urls.csv"
        details_filepath = f"csvs/{job_id}_channel_details.csv"

        if not os.path.exists(urls_filepath) or not os.path.exists(details_filepath):
            # Optionally, you could store job status in Redis/DB
            # and return "queued" or "processing" if files don't exist yet
            return JSONResponse(status_code=404, content={"status": "not_found", "message": "Scrape results not found for this job ID. It might still be processing or failed."})

        urls = pd.read_csv(urls_filepath).to_dict(orient="records")
        details = pd.read_csv(details_filepath).to_dict(orient="records")
        return {"status": "completed", "job_id": job_id, "channel_urls": urls, "channel_details": details}
    except Exception as e:
        logger.error(f"Error fetching data for job_id {job_id}: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# Also update your /download endpoint if you want specific downloads for specific jobs
@app.get("/download/{job_id}/{file_type}") # Example: /download/abc-123/urls or /download/abc-123/details
def download_csv(job_id: str, file_type: str):
    if file_type == "urls":
        filename = f"{job_id}_channel_urls.csv"
    elif file_type == "details":
        filename = f"{job_id}_channel_details.csv"
    else:
        return JSONResponse(status_code=400, content={"error": "Invalid file_type. Must be 'urls' or 'details'."})

    filepath = f"csvs/{filename}"
    if os.path.exists(filepath):
        return FileResponse(path=filepath, filename=filename, media_type="text/csv")
    return JSONResponse(status_code=404, content={"error": "File not found"})