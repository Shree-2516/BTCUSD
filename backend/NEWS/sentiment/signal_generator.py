import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.utils.logger import logger


class SignalGenerator:
    # Source weight mappings as per requirements
    WEIGHT_MAP = {
        "CoinDesk": 1.2,
        "CoinTelegraph": 1.2,
        "Yahoo Finance": 1.0,
        "yfinance": 1.0
    }
    
    @classmethod
    def generate_signal(cls, articles):
        """
        Aggregates article sentiments and generates overall signal and confidence.
        Returns a dict:
        {
            "signal": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "confidence": int (0-100),
            "positive_news": int,
            "neutral_news": int,
            "negative_news": int
        }
        """
        if not articles:
            return {
                "signal": "NEUTRAL",
                "confidence": 0,
                "positive_news": 0,
                "neutral_news": 0,
                "negative_news": 0
            }
            
        scores = {"POSITIVE": 0.0, "NEUTRAL": 0.0, "NEGATIVE": 0.0}
        counts = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0}
        
        for art in articles:
            # Handle DB models (which are objects) and parsed dicts
            sentiment = getattr(art, "sentiment", None) or art.get("sentiment")
            confidence = getattr(art, "confidence", None) or art.get("confidence") or 0.0
            source = getattr(art, "source", None) or art.get("source") or "Yahoo Finance"
            
            if not sentiment:
                continue
                
            sentiment = sentiment.upper()
            weight = cls.WEIGHT_MAP.get(source, 1.0)
            weighted_score = confidence * weight
            
            if sentiment in scores:
                scores[sentiment] += weighted_score
                counts[sentiment] += 1
            else:
                scores["NEUTRAL"] += weighted_score
                counts["NEUTRAL"] += 1
                
        total_score = sum(scores.values())
        
        if total_score > 0:
            winning_signal = max(scores, key=scores.get)
            confidence_percentage = int((scores[winning_signal] / total_score) * 100)
        else:
            winning_signal = "NEUTRAL"
            confidence_percentage = 0
            
        return {
            "signal": winning_signal,
            "confidence": confidence_percentage,
            "positive_news": counts["POSITIVE"],
            "neutral_news": counts["NEUTRAL"],
            "negative_news": counts["NEGATIVE"]
        }
