import os
import asyncio
from groq import Groq
from backend.utils.config_manager import config
from backend.utils.logger import logger
import time

class GroqSentimentClient:
    def __init__(self):
        self.client = Groq(api_key=config.GROQ_API_KEY)
        self.model = config.GROQ_MODEL
        self._cache = {}
        self._cache_duration = 600  # 10 minutes cache

    def get_sentiment(self, market_context: str) -> dict:
        """
        Analyzes market context and returns a sentiment score and reasoning.
        """
        current_time = time.time()
        
        # Simple caching to avoid excessive API calls
        cache_key = f"btc_sentiment_{self.model}"
        if cache_key in self._cache:
            data, ts = self._cache[cache_key]
            if current_time - ts < self._cache_duration:
                return data

        try:
            prompt = f"""
            Analyze the following BTCUSD market context and provide a structured trading intelligence report.
            Context: {market_context}
            
            Return ONLY a JSON object with the following keys:
            - sentiment_score: -1 (Very Bearish) to 1 (Very Bullish)
            - sentiment_label: BEARISH, NEUTRAL, or BULLISH
            - reasoning: A brief one-sentence explanation of the sentiment.
            - trade_thesis: A detailed 2-3 sentence technical justification for the current signal.
            - risk_level: LOW, MEDIUM, HIGH, or CRITICAL.
            - market_context: A short summary of the current market structure (e.g. "Consolidating near support").
            - confidence: 0 to 1
            """
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior quantitative crypto sentiment analyst."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(completion.choices[0].message.content)
            
            self._cache[cache_key] = (result, current_time)
            return result
            
        except Exception as e:
            logger.error(f"Groq API Error: {e}")
            return {
                "sentiment_score": 0,
                "sentiment_label": "NEUTRAL",
                "reasoning": "Error fetching sentiment, falling back to neutral.",
                "trade_thesis": "N/A - AI Engine Offline",
                "risk_level": "UNKNOWN",
                "market_context": "Data link interrupted.",
                "confidence": 0.5
            }

groq_sentiment = GroqSentimentClient()
