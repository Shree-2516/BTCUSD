import asyncio
import json
from datetime import datetime
import pandas as pd
from utils.delta_api import delta_api
from database.db import SessionLocal, Trade
from livetest.trade_manager import trade_manager

class LiveTestManager:
    def __init__(self):
        self.active = False
        self.strategy = None
        self.symbol = "BTCUSD"
        self.resolution = "1h"
        self.history = pd.DataFrame()
        self.active_trade_id = None
        self.lot_size = 0.1

    async def start(self, strategy, lot_size=0.1, resolution="1h"):
        self.active = True
        self.strategy = strategy
        self.resolution = resolution
        self.lot_size = lot_size
        self.active_trade_id = None
        
        # Initial history fetch
        end_ts = int(datetime.now().timestamp())
        start_ts = end_ts - (100 * 3600) # 100 hours
        self.history = delta_api.get_historical_data(self.symbol, self.resolution, start_ts, end_ts)
        
        print(f"Live testing started with strategy: {strategy.name}")

    def stop(self):
        self.active = False
        print("Live testing stopped")

    async def on_ticker(self, ticker_data):
        if not self.active or not self.strategy:
            return None

        last_price = float(ticker_data.get('mark_price', ticker_data.get('close', 0)))
        if last_price == 0: return None

        now = datetime.now()
        current_ts = now.replace(minute=0, second=0, microsecond=0)
        
        temp_history = self.history.copy()
        if current_ts in temp_history.index:
            temp_history.at[current_ts, 'close'] = last_price
            if last_price > temp_history.at[current_ts, 'high']: temp_history.at[current_ts, 'high'] = last_price
            if last_price < temp_history.at[current_ts, 'low']: temp_history.at[current_ts, 'low'] = last_price
        else:
            new_row = pd.DataFrame([{
                'open': last_price, 'high': last_price, 'low': last_price, 'close': last_price, 'volume': 0
            }], index=[current_ts])
            temp_history = pd.concat([temp_history, new_row])

        signal = self.strategy.on_bar(temp_history.iloc[-1], temp_history.iloc[:-1])
        
        trade_event = None
        if signal == 'BUY':
            # Check if already in long
            if not self.active_trade_id:
                try:
                    self.active_trade_id = trade_manager.open_trade(self.symbol, "BUY", last_price, self.lot_size, trade_type="LIVE")
                    trade_event = {"type": "trade_opened", "data": {"id": self.active_trade_id, "type": "BUY", "price": last_price}}
                except Exception as e:
                    print(f"Error opening live trade: {e}")
            else:
                # Check if we need to flip
                db = SessionLocal()
                active_trade = db.query(Trade).filter(Trade.id == self.active_trade_id).first()
                if active_trade and active_trade.type == "SELL":
                    trade_manager.close_trade(self.active_trade_id, last_price, "Strategy Flip")
                    self.active_trade_id = trade_manager.open_trade(self.symbol, "BUY", last_price, self.lot_size, trade_type="LIVE")
                    trade_event = {"type": "trade_opened", "data": {"id": self.active_trade_id, "type": "BUY", "price": last_price}}
                db.close()

        elif signal == 'SELL':
            if not self.active_trade_id:
                try:
                    self.active_trade_id = trade_manager.open_trade(self.symbol, "SELL", last_price, self.lot_size, trade_type="LIVE")
                    trade_event = {"type": "trade_opened", "data": {"id": self.active_trade_id, "type": "SELL", "price": last_price}}
                except Exception as e:
                    print(f"Error opening live trade: {e}")
            else:
                db = SessionLocal()
                active_trade = db.query(Trade).filter(Trade.id == self.active_trade_id).first()
                if active_trade and active_trade.type == "BUY":
                    trade_manager.close_trade(self.active_trade_id, last_price, "Strategy Flip")
                    self.active_trade_id = trade_manager.open_trade(self.symbol, "SELL", last_price, self.lot_size, trade_type="LIVE")
                    trade_event = {"type": "trade_opened", "data": {"id": self.active_trade_id, "type": "SELL", "price": last_price}}
                db.close()

        return trade_event

live_test_manager = LiveTestManager()
