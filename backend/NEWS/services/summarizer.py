import os
import sys
import json
import asyncio
from datetime import datetime
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.NEWS.storage.news_repository import NewsRepository
from backend.utils.logger import logger

class NewsSummarizerService:
    def __init__(self):
        self.is_running = False

    async def generate_summary(self):
        """Simulates an AI generating a categorized executive brief of recent news."""
        try:
            # Fetch the top 20 recent articles
            articles = await asyncio.to_thread(NewsRepository.get_latest_articles, 20)
            
            if not articles:
                logger.info("No articles to summarize.")
                return None
                
            # Simulate Categorization / Summarization
            topics = {
                "Macro Events": [],
                "Regulatory & Compliance": [],
                "Market & On-Chain Activity": [],
                "Other": []
            }
            
            for art in articles:
                text = (art.title + " " + (art.summary or "")).lower()
                
                if any(word in text for word in ["cpi", "fed", "inflation", "rate", "economy", "macro"]):
                    topics["Macro Events"].append(art.title)
                elif any(word in text for word in ["sec", "etf", "bill", "act", "ban", "legal", "court"]):
                    topics["Regulatory & Compliance"].append(art.title)
                elif any(word in text for word in ["whale", "volume", "options", "liquidate", "stablecoin"]):
                    topics["Market & On-Chain Activity"].append(art.title)
                else:
                    topics["Other"].append(art.title)
            
            # Format as a concise bullet point summary
            final_summary = []
            for topic, titles in topics.items():
                if titles:
                    # Taking just top 3 per category to keep it brief
                    final_summary.append({
                        "category": topic,
                        "bullets": titles[:3]
                    })
                    
            topics_json = json.dumps(final_summary)
            
            # Save to database
            await asyncio.to_thread(NewsRepository.save_news_summary, topics_json)
            logger.info("AI News Summary generated and saved.")
            
        except Exception as e:
            logger.error(f"Error in NewsSummarizerService: {e}")

async def news_summary_loop():
    """Background loop to periodically generate news summaries."""
    summarizer = NewsSummarizerService()
    while True:
        try:
            await summarizer.generate_summary()
        except Exception as e:
            logger.error(f"Summary Loop Error: {e}")
        # Run every 4 hours (14400 seconds)
        await asyncio.sleep(14400)
