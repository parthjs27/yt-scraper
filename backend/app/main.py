# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import os
import pandas as pd
from app.scraper import run_scraper
from app.redis_queue import enqueue_scrape_task

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    search_query: str
    max_channel_links: int = 3

@app.post("/scrape")
def enqueue_scrape(request: ScrapeRequest):
    enqueue_scrape_task(request.search_query, request.max_channel_links)
    return {"status": "queued", "message": "Scrape job added to queue."}

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
