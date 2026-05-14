import requests
import pandas as pd
from datetime import datetime
import time

class DeltaClient:
    def __init__(self, base_url="https://api.delta.exchange/v2"):
        self.base_url = base_url
        self.product_id_cache = {}

    def get_product_id(self, symbol="BTCUSD"):
        if symbol in self.product_id_cache:
            return self.product_id_cache[symbol]
        
        url = f"{self.base_url}/products"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                products = res.json().get("result", [])
                for p in products:
                    if p.get("symbol") == symbol:
                        self.product_id_cache[symbol] = p.get("id")
                        return p.get("id")
        except:
            pass
        return 27 # Fallback for BTCUSD perpetual

    def get_l2_orderbook(self, symbol="BTCUSD"):
        product_id = self.get_product_id(symbol)
        url = f"{self.base_url}/orderbook/{product_id}"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                return res.json().get("result", {})
        except:
            pass
        return {}

    def get_ticker(self, symbol="BTCUSD"):
        url = f"{self.base_url}/tickers/{symbol}"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                return res.json().get("result", {})
        except:
            pass
        return {}

    def get_funding_history(self, symbol="BTCUSD", limit=24):
        # Delta uses FUNDING:SYMBOL for funding history candles
        funding_symbol = f"FUNDING:{symbol}"
        end_time = int(time.time())
        start_time = end_time - (limit * 3600)
        
        url = f"{self.base_url}/history/candles"
        params = {
            "symbol": funding_symbol,
            "resolution": "1h",
            "start_time": start_time,
            "end_time": end_time
        }
        try:
            res = requests.get(url, params=params, timeout=5)
            if res.status_code == 200:
                return res.json().get("result", [])
        except:
            pass
        return []

    def get_model_features(self, symbol="BTCUSD"):
        """Consolidate data for ML features"""
        ticker = self.get_ticker(symbol) or {}
        book = self.get_l2_orderbook(symbol) or {}
        
        # Calculate book imbalance
        bids = book.get("bids", [])
        asks = book.get("asks", [])
        bid_vol = sum([float(b["size"]) for b in bids[:10]]) if bids else 1
        ask_vol = sum([float(a["size"]) for a in asks[:10]]) if asks else 1
        imbalance = (bid_vol - ask_vol) / (bid_vol + ask_vol)
        
        return {
            "price": float(ticker.get("mark_price", 0)),
            "oi": float(ticker.get("open_interest", 0)),
            "funding": float(ticker.get("funding_rate", 0)),
            "imbalance": imbalance,
            "vol_24h": float(ticker.get("volume", 0)),
            "timestamp": time.time()
        }

delta_client = DeltaClient()
