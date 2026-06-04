import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import Column, Integer, Float, String, DateTime, Text, desc
from database.db import Base, SessionLocal
from datetime import datetime, timedelta
from utils.logger import logger


class NewsArticle(Base):
    __tablename__ = "news_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    summary = Column(Text)
    source = Column(String(100))
    url = Column(Text, unique=True, index=True)
    published_at = Column(DateTime, nullable=False)
    sentiment = Column(String(20))
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class MarketSentimentModel(Base):
    __tablename__ = "market_sentiment"
    
    id = Column(Integer, primary_key=True, index=True)
    signal = Column(String(20), nullable=False)
    confidence = Column(Integer, nullable=False)
    positive_count = Column(Integer, nullable=False)
    neutral_count = Column(Integer, nullable=False)
    negative_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class NewsRepository:
    @staticmethod
    def get_db():
        """Creates and returns a new DB session."""
        return SessionLocal()

    @classmethod
    def save_articles(cls, articles):
        """
        Saves a list of article dicts to the database.
        Prevents duplicates by checking if the URL already exists.
        Returns the number of successfully saved articles.
        """
        db = cls.get_db()
        saved_count = 0
        try:
            for art in articles:
                # Check if URL exists
                exists = db.query(NewsArticle).filter(NewsArticle.url == art["url"]).first()
                if not exists:
                    db_art = NewsArticle(
                        title=art["title"],
                        summary=art["summary"],
                        source=art["source"],
                        url=art["url"],
                        published_at=art["published_at"],
                        sentiment=art["sentiment"],
                        confidence=art["confidence"]
                    )
                    db.add(db_art)
                    saved_count += 1
            db.commit()
            return saved_count
        except Exception as e:
            db.rollback()
            logger.error(f"Database error saving news articles: {e}")
            raise e
        finally:
            db.close()

    @classmethod
    def get_latest_articles(cls, limit=50):
        """Fetches the latest articles ordered by publication time."""
        db = cls.get_db()
        try:
            return db.query(NewsArticle).order_by(desc(NewsArticle.published_at)).limit(limit).all()
        except Exception as e:
            logger.error(f"Database error fetching latest news: {e}")
            return []
        finally:
            db.close()

    @classmethod
    def get_articles_in_range(cls, hours=24):
        """Fetches articles published within the last N hours."""
        db = cls.get_db()
        since = datetime.utcnow() - timedelta(hours=hours)
        try:
            return db.query(NewsArticle).filter(NewsArticle.published_at >= since).all()
        except Exception as e:
            logger.error(f"Database error fetching news in range: {e}")
            return []
        finally:
            db.close()

    @classmethod
    def save_market_sentiment(cls, signal_data):
        """Saves a generated market sentiment signal record to DB."""
        db = cls.get_db()
        try:
            db_sig = MarketSentimentModel(
                signal=signal_data["signal"],
                confidence=signal_data["confidence"],
                positive_count=signal_data["positive_news"],
                neutral_count=signal_data["neutral_news"],
                negative_count=signal_data["negative_news"]
            )
            db.add(db_sig)
            db.commit()
            db.refresh(db_sig)
            return db_sig
        except Exception as e:
            db.rollback()
            logger.error(f"Database error saving market sentiment: {e}")
            raise e
        finally:
            db.close()

    @classmethod
    def get_latest_signal(cls):
        """Fetches the most recent market sentiment signal record."""
        db = cls.get_db()
        try:
            return db.query(MarketSentimentModel).order_by(desc(MarketSentimentModel.created_at)).first()
        except Exception as e:
            logger.error(f"Database error fetching latest signal: {e}")
            return None
        finally:
            db.close()

    @classmethod
    def get_historical_signals(cls, limit=100):
        """Fetches historical market sentiment signal records."""
        db = cls.get_db()
        try:
            return db.query(MarketSentimentModel).order_by(desc(MarketSentimentModel.created_at)).limit(limit).all()
        except Exception as e:
            logger.error(f"Database error fetching historical signals: {e}")
            return []
        finally:
            db.close()
