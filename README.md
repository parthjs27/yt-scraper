# 📺 YouTube Scraper

A scalable and efficient YouTube data scraper built using **FastAPI**, **Selenium**, and **Redis**, designed to extract information like channel metadata. Built for extensibility and high-volume scraping.

---

## 🚀 Features

- 🔍 Scrapes YouTube channel details (title, description, subscribers, etc.)
- 🧠 Option to integrate ML for dynamic content filtering/summarization
- ⚙️ FastAPI backend with async task queue (Redis)
- 🕓 Scheduled cleanup via cron job

---

## 🛠️ Tech Stack

| Layer        | Technology           |
|-------------|----------------------|
| Backend API | FastAPI              |
| Scraper     | Selenium WebDriver   |
| Queue       | Redis                |
| Scheduler   | cron (Linux)         |
| Deployment  | EC2 (Ubuntu AMI)     |
| Frontend    | Next.js (Static/SSR) |
