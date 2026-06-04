import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi import APIRouter, Query, HTTPException
from NEWS.storage.news_repository import NewsRepository
import asyncio
from datetime import datetime


news_router = APIRouter(prefix="/api/news", tags=["news"])

@news_router.get("/latest")
async def get_latest_news(limit: int = Query(default=20, ge=1, le=100)):
    """
    Returns recent news articles stored in the database.
    Query parameter 'limit' defaults to 20.
    """
    try:
        # Query database in a worker thread
        articles = await asyncio.to_thread(NewsRepository.get_latest_articles, limit)
        return [
            {
                "id": art.id,
                "title": art.title,
                "summary": art.summary,
                "source": art.source,
                "url": art.url,
                "published_at": art.published_at.isoformat() if isinstance(art.published_at, datetime) else art.published_at,
                "sentiment": art.sentiment,
                "confidence": art.confidence,
                "created_at": art.created_at.isoformat() if isinstance(art.created_at, datetime) else art.created_at
            }
            for art in articles
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch latest news: {str(e)}")

@news_router.get("/sentiment")
async def get_sentiment_summary():
    """
    Returns the latest consolidated market sentiment summary.
    This conforms to the dashboard support method structure:
    {
        "signal": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
        "confidence": 0-100,
        "positive_news": int,
        "neutral_news": int,
        "negative_news": int
    }
    """
    try:
        sig = await asyncio.to_thread(NewsRepository.get_latest_signal)
        if not sig:
            return {
                "signal": "NEUTRAL",
                "confidence": 0,
                "positive_news": 0,
                "neutral_news": 0,
                "negative_news": 0
            }
        return {
            "signal": sig.signal,
            "confidence": sig.confidence,
            "positive_news": sig.positive_count,
            "neutral_news": sig.neutral_count,
            "negative_news": sig.negative_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sentiment summary: {str(e)}")

@news_router.get("/signal")
async def get_latest_signal():
    """
    Returns the latest BTC signal and confidence.
    """
    try:
        sig = await asyncio.to_thread(NewsRepository.get_latest_signal)
        if not sig:
            return {
                "signal": "NEUTRAL",
                "confidence": 0,
                "created_at": None
            }
        return {
            "signal": sig.signal,
            "confidence": sig.confidence,
            "created_at": sig.created_at.isoformat() if isinstance(sig.created_at, datetime) else sig.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch latest signal: {str(e)}")

@news_router.get("/history")
async def get_historical_signals(limit: int = Query(default=50, ge=1, le=500)):
    """
    Returns historical signals from the database.
    """
    try:
        signals = await asyncio.to_thread(NewsRepository.get_historical_signals, limit)
        return [
            {
                "id": sig.id,
                "signal": sig.signal,
                "confidence": sig.confidence,
                "positive_news": sig.positive_count,
                "neutral_news": sig.neutral_count,
                "negative_news": sig.negative_count,
                "created_at": sig.created_at.isoformat() if isinstance(sig.created_at, datetime) else sig.created_at
            }
            for sig in signals
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical signals: {str(e)}")
