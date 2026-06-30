import pandas as pd
import numpy as np

class RegimeDetector:
    """
    Identifies current market regime: Trending Bullish, Trending Bearish, Ranging, or High Volatility.
    """
    
    @staticmethod
    def detect(df: pd.DataFrame) -> dict:
        if df.empty or len(df) < 50:
            return {"regime": "UNKNOWN", "description": "Insufficient data"}
            
        # 1. Trend Strength (using distance from MA)
        ma50 = df['close'].rolling(50).mean()
        ma20 = df['close'].rolling(20).mean()
        
        last_close = df.iloc[-1]['close']
        last_ma50 = ma50.iloc[-1]
        last_ma20 = ma20.iloc[-1]
        
        # 2. Volatility (ATR relative to price)
        # Assuming ATR is already in df or calculate here
        high_low = df['high'] - df['low']
        atr = high_low.rolling(14).mean().iloc[-1]
        volatility_ratio = atr / last_close
        
        # 3. Ranging check (Standard deviation of close)
        std_dev = df['close'].rolling(20).std().iloc[-1]
        std_ratio = std_dev / last_close
        
        # Logic
        if volatility_ratio > 0.025: # Arbitrary threshold for high vol
            regime = "HIGH_VOLATILITY"
            desc = "Extreme price swings detected. High risk."
        elif last_close > last_ma20 > last_ma50:
            regime = "TRENDING_BULLISH"
            desc = "Strong upward momentum. Buy dips."
        elif last_close < last_ma20 < last_ma50:
            regime = "TRENDING_BEARISH"
            desc = "Strong downward momentum. Sell rallies."
        elif std_ratio < 0.005:
            regime = "RANGING_TIGHT"
            desc = "Price consolidated. Breakout imminent."
        else:
            regime = "RANGING_WIDE"
            desc = "Price oscillating in a range."
            
        return {
            "regime": regime,
            "description": desc,
            "volatility_ratio": round(volatility_ratio, 4),
            "trend_strength": round((last_close - last_ma50) / last_ma50, 4)
        }

regime_detector = RegimeDetector()
