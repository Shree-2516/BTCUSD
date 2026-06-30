import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.NEWS.fetchers.yahoo_news import YahooNewsFetcher
from backend.NEWS.fetchers.coindesk_rss import CoinDeskRSSFetcher
from backend.NEWS.fetchers.cointelegraph_rss import CoinTelegraphRSSFetcher
from backend.NEWS.utils.deduplication import Deduplicator
from backend.NEWS.sentiment.sentiment_engine import SentimentEngine
from backend.NEWS.sentiment.signal_generator import SignalGenerator
from backend.NEWS.storage.news_repository import NewsRepository
from backend.utils.logger import logger
from datetime import datetime


class NewsService:
    @classmethod
    def run_pipeline(cls):
        """
        Orchestrates the entire news processing pipeline.
        This includes fetching news, deduplicating articles, analyzing sentiments,
        storing articles, generating a BTC market sentiment signal, and saving it.
        """
        logger.info("Executing News Sentiment Pipeline...")
        
        # 1. Fetch news articles from all 3 sources
        yahoo_articles = YahooNewsFetcher.fetch_news()
        coindesk_articles = CoinDeskRSSFetcher.fetch_news()
        cointelegraph_articles = CoinTelegraphRSSFetcher.fetch_news()
        
        all_fetched = yahoo_articles + coindesk_articles + cointelegraph_articles
        logger.info(f"Pipeline: Fetched {len(all_fetched)} total articles (Yahoo: {len(yahoo_articles)}, CoinDesk: {len(coindesk_articles)}, CoinTelegraph: {len(cointelegraph_articles)}).")
        
        if not all_fetched:
            logger.warning("Pipeline: No news articles fetched from any sources. Skipping run.")
            return None
            
        # 2. Get existing articles from db for deduplication check (limit to last 100 for speed)
        existing_articles = NewsRepository.get_latest_articles(100)
        existing_dicts = [
            {"title": art.title, "url": art.url} for art in existing_articles
        ]
        
        # 3. Deduplicate (URL exact match + Jaccard Title similarity)
        unique_articles = []
        seen_urls = {art["url"] for art in existing_dicts}
        seen_titles = {art["title"] for art in existing_dicts}
        
        for art in all_fetched:
            url = art.get("url")
            if url in seen_urls:
                continue
                
            # Perform title fuzzy match deduplication
            if Deduplicator.is_duplicate(art, unique_articles) or Deduplicator.is_duplicate(art, existing_dicts):
                continue
                
            unique_articles.append(art)
            seen_urls.add(url)
            
        logger.info(f"Pipeline: Filtered down to {len(unique_articles)} new unique articles.")
        
        # 4. Analyze sentiment and store if there are new articles
        if unique_articles:
            sentiment_engine = SentimentEngine()
            analyzed_articles = sentiment_engine.analyze_articles(unique_articles)
            
            # Save analyzed articles to DB
            saved_count = NewsRepository.save_articles(analyzed_articles)
            logger.info(f"Pipeline: Successfully saved {saved_count} new analyzed articles to the database.")
        else:
            logger.info("Pipeline: No new articles to analyze. Re-generating signal on existing database content.")
            
        # 5. Fetch articles from the last 24 hours to generate the BTC market signal
        recent_articles = NewsRepository.get_articles_in_range(hours=24)
        
        # Fallback: if no articles in 24 hours, fall back to the latest 20 articles overall from DB
        if not recent_articles:
            logger.info("Pipeline: No articles in last 24 hours. Falling back to the latest 20 stored articles.")
            recent_articles = NewsRepository.get_latest_articles(limit=20)
            
        # 6. Generate overall market signal
        signal_data = SignalGenerator.generate_signal(recent_articles)
        logger.info(f"Pipeline: Generated BTC Market Signal: {signal_data['signal']} | Confidence: {signal_data['confidence']}% (Pos: {signal_data['positive_news']}, Neu: {signal_data['neutral_news']}, Neg: {signal_data['negative_news']})")
        
        # 7. Save signal record
        NewsRepository.save_market_sentiment(signal_data)
        logger.info("Pipeline: BTC Market Sentiment signal saved to database successfully.")
        
        return signal_data
