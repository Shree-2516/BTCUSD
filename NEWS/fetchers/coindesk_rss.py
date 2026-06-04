import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import feedparser  # pyrefly: ignore[missing-import]
from datetime import datetime, timezone
import time
from utils.logger import logger


class CoinDeskRSSFetcher:
    URL = "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml"
    
    @classmethod
    def fetch_news(cls):
        """
        Fetches latest CoinDesk news from its RSS feed.
        Returns a list of standardized dictionaries.
        """
        try:
            feed = feedparser.parse(cls.URL)
            if feed.bozo:
                # bozo is non-zero if there was a parsing issue (sometimes we can still get entries, so just log it)
                logger.warning(f"CoinDesk RSS feed parsing had minor anomalies: {feed.bozo_exception}")
                
            articles = []
            for entry in feed.entries:
                title = entry.get("title")
                summary_val = entry.get("summary") or entry.get("description") or ""
                summary = summary_val if isinstance(summary_val, str) else ""
                url = entry.get("link")
                source = "CoinDesk"
                
                # Parse published time
                pub_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
                if isinstance(pub_parsed, (tuple, time.struct_time)) and len(pub_parsed) >= 6:
                    try:
                        year = int(pub_parsed[0])
                        month = int(pub_parsed[1])
                        day = int(pub_parsed[2])
                        hour = int(pub_parsed[3])
                        minute = int(pub_parsed[4])
                        second = int(pub_parsed[5])
                        published_at = datetime(year, month, day, hour, minute, second)
                    except (ValueError, TypeError, IndexError):
                        published_at = datetime.now(timezone.utc).replace(tzinfo=None)
                else:
                    published_at = datetime.now(timezone.utc).replace(tzinfo=None)
                    
                if not isinstance(title, str) or not isinstance(url, str):
                    continue
                    
                articles.append({
                    "title": title.strip(),
                    "summary": summary.strip(),
                    "source": source,
                    "url": url.strip(),
                    "published_at": published_at
                })
            return articles
        except Exception as e:
            logger.error(f"Error fetching CoinDesk RSS feed: {e}")
            return []

