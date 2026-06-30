import requests
import pandas as pd
from datetime import datetime, timedelta
import time
import random
from backend.utils.delta_api import delta_api
from backend.insights.advanced_predictor import advanced_predictor
from backend.insights.prediction_engine import prediction_engine

class InsightsManager:
    def __init__(self):
        self.last_fng = {"value": "50", "label": "Neutral"}
        self.last_fng_update = 0

    def get_fear_greed_index(self):
        """Fetch Fear & Greed Index from alternative.me"""
        now = time.time()
        if now - self.last_fng_update < 3600: # Cache for 1 hour
            return self.last_fng
        
        try:
            response = requests.get("https://api.alternative.me/fng/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                fng = data.get("data", [{}])[0]
                self.last_fng = {
                    "value": fng.get("value", "50"),
                    "label": fng.get("value_classification", "Neutral"),
                    "timestamp": fng.get("timestamp")
                }
                self.last_fng_update = now
        except Exception as e:
            print(f"Error fetching F&G Index: {e}")
        
        return self.last_fng

    def get_roi_data(self):
        """Calculate ROI for different periods"""
        ticker = delta_api.get_ticker("BTCUSD")
        if not ticker:
            return {}
        
        current_price = float(ticker.get("mark_price", 0))
        if current_price == 0:
            return {}

        # Standard fixed periods
        periods = {
            "Weekly": datetime.now() - timedelta(days=7),
            "Monthly": datetime.now() - timedelta(days=30),
            "Yearly": datetime(datetime.now().year, 1, 1)
        }

        roi_data = {}
        for label, start_date in periods.items():
            start_ts = int(start_date.timestamp())
            end_ts = start_ts + 3600 * 4 # 4 hour window
            
            # Fetch data for that period
            df = delta_api.get_historical_data("BTCUSD", "1h", start_ts, end_ts)
            if not df.empty:
                start_price = float(df.iloc[0]["open"])
                change = ((current_price - start_price) / start_price) * 100
                roi_data[label] = {
                    "start_price": start_price,
                    "return_pct": round(change, 2),
                    "start_date": start_date.strftime("%Y-%m-%d")
                }
            else:
                roi_data[label] = {"start_price": 0, "return_pct": 0, "start_date": "N/A"}

        # Dynamic Max Return (Earliest data available on exchange)
        try:
            # Fetch long history to find the first candle
            old_start_ts = int(datetime(2018, 1, 1).timestamp())
            df_max = delta_api.get_historical_data("BTCUSD", "1d", old_start_ts, int(time.time()))
            
            if not df_max.empty:
                first_candle = df_max.iloc[0]
                start_price = float(first_candle["open"])
                start_dt = df_max.index[0]
                
                # Format label: "Since 2023" or "Since Dec 2023" if recent
                if start_dt.year < datetime.now().year:
                    start_label = f"Since {start_dt.year}"
                else:
                    start_label = f"Since {start_dt.strftime('%b %Y')}"
                
                change = ((current_price - start_price) / start_price) * 100
                roi_data["Max"] = {
                    "start_price": start_price,
                    "return_pct": round(change, 2),
                    "start_date": start_label
                }
            else:
                # Fallback to general bull cycle start if no exchange data found
                roi_data["Max"] = {
                    "start_price": 15500.0, 
                    "return_pct": round(((current_price - 15500) / 15500) * 100, 2), 
                    "start_date": "Since 2022"
                }
        except Exception as e:
            print(f"Error calculating Max ROI: {e}")
            roi_data["Max"] = {"start_price": 0, "return_pct": 0, "start_date": "Error"}

        return roi_data

    def get_halving_data(self):
        """Calculate time to next Bitcoin halving (Approx April 2028)"""
        # Bitcoin halving happens every 210,000 blocks. 
        # Last halving: Block 840,000 (April 20, 2024)
        # Next halving: Block 1,050,000
        halving_date = datetime(2028, 4, 15) # Approximated
        time_left = halving_date - datetime.now()
        
        return {
            "days": time_left.days,
            "hours": time_left.seconds // 3600,
            "date": "April 2028 (Approx)"
        }

    def get_whale_alerts(self):
        """Realistic mock whale alerts"""
        exchanges = ["Binance", "Coinbase", "Kraken", "Bybit", "Unknown Wallet"]
        actions = ["moved", "transferred", "deposited"]
        
        alerts = []
        for _ in range(5):
            amount = random.randint(100, 5000)
            from_ex = random.choice(exchanges)
            to_ex = random.choice([e for e in exchanges if e != from_ex])
            impact = "Low" if amount < 1000 else "Medium" if amount < 3000 else "High"
            
            alerts.append({
                "message": f"Whale {random.choice(actions)} {amount} BTC from {from_ex} to {to_ex}",
                "impact": impact,
                "time": "Just now"
            })
        return alerts

    def get_advanced_predictions(self, symbol="BTCUSD"):
        """
        Combines existing predictions, advanced predictions, regime analysis,
        and volatility analysis into a single structured response.
        """
        # Get existing prediction
        current_pred = prediction_engine.get_live_prediction(symbol)
        
        # Get advanced multi-timeframe predictions
        adv_pred = advanced_predictor.predict_all(symbol, current_pred)
        
        # Return as dict
        return adv_pred.dict()

insights_manager = InsightsManager()
