import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi import APIRouter, Query, HTTPException
from backend.NEWS.storage.news_repository import NewsRepository
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

@news_router.get("/sentiment-trends")
async def get_sentiment_trends():
    """Returns aggregated sentiment data over the last 7 days."""
    try:
        trends = await asyncio.to_thread(NewsRepository.get_sentiment_trends, 7)
        return [
            {
                "id": t.id,
                "signal": t.signal,
                "confidence": t.confidence,
                "positive_news": t.positive_count,
                "neutral_news": t.neutral_count,
                "negative_news": t.negative_count,
                "created_at": t.created_at.isoformat() if isinstance(t.created_at, datetime) else t.created_at
            }
            for t in trends
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sentiment trends: {str(e)}")

@news_router.get("/impact")
async def get_market_impact():
    """Returns high-impact news coupled with post-release price volatility."""
    from backend.utils.delta_api import delta_api
    try:
        events = await asyncio.to_thread(NewsRepository.get_high_impact_events, 85, 10)
        results = []
        for ev in events:
            # We want to check 1H and 4H price changes after this event.
            ev_time = ev.published_at.timestamp()
            # Fetch 1m candles for 4 hours after the event
            # Note: delta_api.get_historical_data might need proper timestamps
            df = await asyncio.to_thread(delta_api.get_historical_data, "BTCUSD", "15m", int(ev_time - 3600), int(ev_time + 4*3600))
            
            price_change_1h = 0
            price_change_4h = 0
            
            if not df.empty:
                # Basic calculation logic for impact
                try:
                    start_price = float(df.iloc[0]["close"])
                    # Assuming 15m resolution, 4 candles = 1h, 16 candles = 4h
                    end_1h = min(4, len(df)-1)
                    end_4h = min(16, len(df)-1)
                    
                    price_1h = float(df.iloc[end_1h]["close"])
                    price_4h = float(df.iloc[end_4h]["close"])
                    
                    price_change_1h = ((price_1h - start_price) / start_price) * 100
                    price_change_4h = ((price_4h - start_price) / start_price) * 100
                except Exception:
                    pass
                    
            results.append({
                "id": ev.id,
                "title": ev.title,
                "sentiment": ev.sentiment,
                "confidence": ev.confidence,
                "published_at": ev.published_at.isoformat() if isinstance(ev.published_at, datetime) else ev.published_at,
                "price_change_1h": round(price_change_1h, 2),
                "price_change_4h": round(price_change_4h, 2)
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market impact: {str(e)}")

@news_router.get("/summary")
async def get_ai_summary():
    """Returns the latest compiled AI news summary."""
    import json
    try:
        summary = await asyncio.to_thread(NewsRepository.get_latest_summary)
        if not summary:
            return {"topics": [], "created_at": None}
            
        return {
            "topics": json.loads(summary.topics),
            "created_at": summary.created_at.isoformat() if isinstance(summary.created_at, datetime) else summary.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch AI summary: {str(e)}")
