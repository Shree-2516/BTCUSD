import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import yfinance as yf
from datetime import datetime, timezone
from backend.utils.logger import logger


class YahooNewsFetcher:
    @staticmethod
    def fetch_news():
        """
        Fetches latest BTC-USD news from Yahoo Finance.
        Returns a list of standardized dictionaries.
        """
        try:
            ticker = yf.Ticker("BTC-USD")
            news_items = ticker.news
            if not news_items:
                logger.warning("Yahoo Finance returned no news for BTC-USD.")
                return []
                
            articles = []
            for item in news_items:
                title = item.get("title")
                summary = item.get("summary") or ""
                source = item.get("publisher") or "Yahoo Finance"
                url = item.get("link")
                
                # Parse published time (Unix timestamp)
                pub_time = item.get("providerPublishTime")
                if pub_time:
                    try:
                        published_at = datetime.fromtimestamp(pub_time, tz=timezone.utc).replace(tzinfo=None)
                    except Exception:
                        published_at = datetime.utcnow()
                else:
                    published_at = datetime.utcnow()
                    
                if not title or not url:
                    continue
                    
                articles.append({
                    "title": title.strip(),
                    "summary": summary.strip(),
                    "source": source.strip(),
                    "url": url.strip(),
                    "published_at": published_at
                })
            return articles
        except Exception as e:
            logger.error(f"Error fetching Yahoo Finance news: {e}")
            return []
