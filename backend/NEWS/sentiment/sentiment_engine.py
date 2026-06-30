import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.NEWS.sentiment.finbert_analyzer import FinBERTAnalyzer
from backend.NEWS.utils.text_cleaner import TextCleaner
from backend.utils.logger import logger


class SentimentEngine:
    def __init__(self):
        self.analyzer = FinBERTAnalyzer()
        
    def analyze_articles(self, articles):
        """
        Inputs a list of news article dicts.
        Computes sentiment and confidence score for each article.
        Returns a list of updated article dicts.
        """
        logger.info(f"Running sentiment analysis on {len(articles)} articles...")
        analyzed = []
        for idx, art in enumerate(articles):
            title = art.get("title", "")
            summary = art.get("summary", "")
            
            # Combine title and summary for richer sentiment context
            text_to_analyze = title
            if summary:
                # Clean HTML tags and formatting from summary before combining
                cleaned_summary = TextCleaner.clean(summary)
                if cleaned_summary:
                    text_to_analyze += ". " + cleaned_summary
            
            sentiment, confidence = self.analyzer.analyze(text_to_analyze)
            
            art_copy = art.copy()
            art_copy["sentiment"] = sentiment
            art_copy["confidence"] = confidence
            
            analyzed.append(art_copy)
            
            # Log periodic progress
            if (idx + 1) % 10 == 0 or (idx + 1) == len(articles):
                logger.info(f"Analyzed {idx + 1}/{len(articles)} articles.")
                
        return analyzed
