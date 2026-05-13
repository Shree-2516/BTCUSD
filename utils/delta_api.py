import requests
import pandas as pd
import time
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("DELTA_BASE_URL", "https://api.deltaexchange.in")

class DeltaAPI:
    def __init__(self):
        self.base_url = BASE_URL

    def get_historical_data(self, symbol, resolution, start_time, end_time):
        """
        Fetch historical candle data from Delta Exchange.
        resolution: '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'
        start_time, end_time: unix timestamp in seconds
        """
        endpoint = f"{self.base_url}/v2/history/candles"
        params = {
            "symbol": symbol,
            "resolution": resolution,
            "start": start_time,
            "end": end_time
        }
        
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json().get("result", [])
                if not data:
                    return pd.DataFrame()
                
                df = pd.DataFrame(data)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                df.set_index('time', inplace=True)
                df.sort_index(inplace=True)
                # Ensure columns are numeric
                cols = ['open', 'high', 'low', 'close', 'volume']
                df[cols] = df[cols].apply(pd.to_numeric)
                return df
            else:
                print(f"API Error: {response.status_code} - {response.text}")
                return pd.DataFrame()
        except Exception as e:
            print(f"Connection Error: {e}")
            return pd.DataFrame()

    def get_ticker(self, symbol):
        endpoint = f"{self.base_url}/v2/tickers/{symbol}"
        try:
            response = requests.get(endpoint, timeout=5)
            if response.status_code == 200:
                return response.json().get("result", {})
            return {}
        except Exception as e:
            print(f"Ticker Error: {e}")
            return {}

delta_api = DeltaAPI()
