from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger("finrisk")
logging.basicConfig(level=logging.INFO)

EVENT_LABELS = [
    "Geopolitical",
    "Macroeconomic",
    "Monetary Policy",
    "Corporate Earnings",
    "Mergers and Acquisitions",
    "Regulatory",
    "Market Movement",
]
POSITIVE_WORDS = {"growth", "profit", "surge", "gain", "recovery", "strong", "rally", "beat"}
NEGATIVE_WORDS = {"loss", "fall", "drop", "crisis", "war", "weak", "risk", "inflation", "recession"}


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=8, max_length=5000)
    ticker: str | None = Field(default=None, max_length=12)


class RiskSignal(BaseModel):
    text: str
    sentiment: float = Field(ge=-1.0, le=1.0)
    sentiment_label: str
    event_type: str
    impact_score: int = Field(ge=1, le=10)
    model_status: str


def _fallback_sentiment(text: str) -> tuple[float, str]:
    words = set(text.lower().split())
    positive = len(words & POSITIVE_WORDS)
    negative = len(words & NEGATIVE_WORDS)
    score = max(-1.0, min(1.0, (positive - negative) / max(4, positive + negative)))
    label = "positive" if score > 0.08 else "negative" if score < -0.08 else "neutral"
    return round(score, 4), label


def _fallback_event(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ("war", "election", "sanction", "conflict")):
        return "Geopolitical"
    if any(word in lowered for word in ("rate", "inflation", "gdp", "jobs", "economy")):
        return "Macroeconomic"
    if any(word in lowered for word in ("earnings", "revenue", "profit", "guidance")):
        return "Corporate Earnings"
    if any(word in lowered for word in ("acquire", "merger", "acquisition")):
        return "Mergers and Acquisitions"
    return "Market Movement"


@lru_cache(maxsize=1)
def _load_pipelines() -> tuple[Any, Any] | None:
    try:
        from transformers import pipeline

        sentiment = pipeline("text-classification", model="ProsusAI/finbert", top_k=None)
        events = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        return sentiment, events
    except (ImportError, OSError, RuntimeError, ValueError) as exc:
        logger.warning("Transformer models unavailable; using fallback classifiers: %s", exc)
        return None


def analyze_text(text: str) -> RiskSignal:
    pipelines = _load_pipelines()
    status = "fallback"
    if pipelines is None:
        score, label = _fallback_sentiment(text)
        event = _fallback_event(text)
    else:
        sentiment_pipeline, event_pipeline = pipelines
        try:
            result = sentiment_pipeline(text[:2000])[0]
            scores = {item["label"].lower(): float(item["score"]) for item in result}
            score = round(scores.get("positive", 0.0) - scores.get("negative", 0.0), 4)
            label = max(scores, key=scores.get)
            event_result = event_pipeline(text[:2000], candidate_labels=EVENT_LABELS)
            event = str(event_result["labels"][0])
            status = "transformers"
        except (KeyError, IndexError, TypeError, ValueError, RuntimeError) as exc:
            logger.warning("Transformer inference failed; using fallback classifiers: %s", exc)
            score, label = _fallback_sentiment(text)
            event = _fallback_event(text)

    impact = max(1, min(10, round(1 + abs(score) * 7 + (2 if event in {"Geopolitical", "Macroeconomic"} else 0))))
    return RiskSignal(
        text=text,
        sentiment=score,
        sentiment_label=label,
        event_type=event,
        impact_score=impact,
        model_status=status,
    )


def _fallback_news() -> list[dict[str, str]]:
    return [
        {"title": "Central bank signals steady path for interest rates", "source": "FinRisk synthetic feed"},
        {"title": "Technology sector reports strong quarterly earnings growth", "source": "FinRisk synthetic feed"},
        {"title": "Global markets assess renewed geopolitical tensions", "source": "FinRisk synthetic feed"},
    ]


def fetch_news(query: str = "financial markets") -> list[dict[str, str]]:
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        return _fallback_news()
    try:
        response = requests.get(
            "https://newsapi.org/v2/everything",
            params={"q": query, "apiKey": api_key, "language": "en", "pageSize": 10, "sortBy": "publishedAt"},
            timeout=8,
        )
        response.raise_for_status()
        articles = response.json().get("articles", [])
        return [
            {"title": str(article.get("title", "")), "source": str(article.get("source", {}).get("name", "NewsAPI"))}
            for article in articles
            if article.get("title")
        ] or _fallback_news()
    except (requests.RequestException, ValueError, TypeError) as exc:
        logger.warning("NewsAPI unavailable; using synthetic feed: %s", exc)
        return _fallback_news()


def fetch_market(ticker: str) -> dict[str, float | str]:
    try:
        import yfinance as yf

        history = yf.Ticker(ticker).history(period="5d")
        if history.empty:
            raise ValueError("No market history returned")
        close = float(history["Close"].iloc[-1])
        previous = float(history["Close"].iloc[-2]) if len(history) > 1 else close
        return {"ticker": ticker.upper(), "price": round(close, 2), "change_percent": round((close / previous - 1) * 100, 2)}
    except (ImportError, ValueError, KeyError, IndexError, TypeError) as exc:
        logger.warning("Market data unavailable for %s: %s", ticker, exc)
        return {"ticker": ticker.upper(), "price": 100.0, "change_percent": 0.0}


app = FastAPI(title="FinRisk-AI Risk Engine", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=RiskSignal)
def analyze(request: AnalyzeRequest) -> RiskSignal:
    return analyze_text(request.text)


@app.get("/api/news")
def news(query: str = Query(default="financial markets", max_length=100)) -> list[dict[str, Any]]:
    return [dict(article, signal=analyze_text(article["title"]).model_dump()) for article in fetch_news(query)]


@app.get("/api/market/{ticker}")
def market(ticker: str) -> dict[str, float | str]:
    if not ticker.replace(".", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid ticker")
    return fetch_market(ticker)
