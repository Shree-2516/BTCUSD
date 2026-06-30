import joblib
import pandas as pd
import numpy as np
import time
from backend.utils.delta_client import delta_client
from backend.utils.delta_api import delta_api
from datetime import datetime, timedelta
import os

class PredictionEngine:
    def __init__(self):
        self.dir_model = None
        self.vol_model = None
        self.load_models()

    def load_models(self):
        try:
            if os.path.exists('models/direction_model.joblib'):
                self.dir_model = joblib.load(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'direction_model.joblib'))
                self.vol_model = joblib.load(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'volatility_model.joblib'))
        except Exception as e:
            import traceback
            print(f"Error loading models: {e}")
            traceback.print_exc()

    def get_live_prediction(self, symbol="BTCUSD"):
        try:
            if not self.dir_model:
                return self.get_mock_prediction()

            features_data = delta_client.get_model_features(symbol)
            
            # Prepare input for model
            end_ts = int(time.time())
            start_ts = end_ts - (48 * 3600) # 48 hours for rolling stats
            df = delta_api.get_historical_data(symbol, "1h", start_ts, end_ts)
            
            if df.empty: return self.get_mock_prediction()
            
            df['returns'] = df['close'].pct_change()
            df['volatility'] = df['returns'].rolling(24).std()
            df['ma7'] = df['close'].rolling(7).mean()
            df['ma25'] = df['close'].rolling(25).mean()
            df['diff'] = (df['ma7'] - df['ma25']) / df['ma25']
            
            last_row = df.iloc[-1]
            X = pd.DataFrame([[
                last_row['close'],
                last_row['diff'],
                last_row['volatility']
            ]], columns=['close', 'diff', 'volatility'])
            
            # Predictions
            prob = self.dir_model.predict_proba(X)[0] 
            buy_conf = float(prob[1]) * 100
            direction = "BUY" if buy_conf > 55 else "SELL" if buy_conf < 45 else "HOLD"
            
            vol_pred = float(self.vol_model.predict(X)[0])
            
            predicted_range = {
                "low": last_row['close'] * (1 - vol_pred),
                "high": last_row['close'] * (1 + vol_pred)
            }
            
            # Indicator signals for UI breakdown
            indicators = {
                "MA Cross": "BULLISH" if last_row['diff'] > 0 else "BEARISH",
                "Volatility": "STABLE" if last_row['volatility'] < 0.015 else "UNSTABLE",
                "Momentum": "POSITIVE" if last_row['returns'] > 0 else "NEGATIVE"
            }

            return {
                "symbol": symbol,
                "trend": direction,
                "confidence": round(buy_conf if direction == "BUY" else (100 - buy_conf) if direction == "SELL" else 50, 1),
                "volatility_forecast": f"{round(vol_pred * 100, 2)}%",
                "predicted_range": predicted_range,
                "whale_activity": self.get_whale_activity(),
                "indicators": indicators,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception as e:
            import traceback
            print(f"Prediction Error: {e}")
            traceback.print_exc()
            return self.get_mock_prediction()

    def get_whale_activity(self):
        try:
            book = delta_client.get_l2_orderbook("BTCUSD")
            bids = book.get("bids", [])
            asks = book.get("asks", [])
            
            large_bids = sum([float(b["size"]) for b in bids if float(b["size"]) > 500])
            large_asks = sum([float(a["size"]) for a in asks if float(a["size"]) > 500])
            
            if large_bids > large_asks * 1.5: return "Bullish (Large Buy Walls)"
            if large_asks > large_bids * 1.5: return "Bearish (Large Sell Walls)"
            return "Stable (Neutral Whale Flow)"
        except:
            return "Stable"

    def get_mock_prediction(self):
        return {
            "trend": "NEUTRAL",
            "confidence": 50.0,
            "volatility_forecast": "0.5%",
            "predicted_range": {"low": 60000, "high": 61000},
            "whale_activity": "Stable",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

prediction_engine = PredictionEngine()
