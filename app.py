from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import os
import importlib
import inspect
from datetime import datetime, timedelta
import asyncio
import json
from typing import Optional


from utils.delta_api import delta_api
from wallet.manager import wallet_manager
from report.manager import report_manager
from backtest.engine import BacktestEngine
from strategies.base_strategy import BaseStrategy
from database.db import init_db
from livetest.trade_manager import trade_manager
from insights.manager import insights_manager


# Initialize database
try:
    print(f"Connecting to database at {os.getenv('POSTGRES_URL')}")
    init_db()
    print("Database initialized successfully.")
except Exception as e:
    print(f"CRITICAL: Database initialization failed: {e}")
    # We continue so the app starts, but functionality will be limited

app = FastAPI(title="BTCUSD Trading Dashboard")

# Ensure static folder exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: Request {request.method} {request.url.path}")
    response = await call_next(request)
    if response.status_code == 404:
        print(f"DEBUG: 404 for {request.url.path}")
    return response

# State for live testing
live_active = False
live_strategy = None
live_trades = []

class BacktestRequest(BaseModel):
    strategy_name: str
    initial_capital: float
    start_date: str
    end_date: str
    resolution: str = "1h"

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return JSONResponse(status_code=204, content={})

@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    with open("static/index.html", "r") as f:
        return f.read()

@app.get("/api/strategies")
async def list_strategies():
    strategies = []
    for file in os.listdir("strategies"):
        if file.endswith(".py") and file != "base_strategy.py":
            module_name = f"strategies.{file[:-3]}"
            module = importlib.import_module(module_name)
            for name, obj in inspect.getmembers(module):
                if inspect.isclass(obj) and issubclass(obj, BaseStrategy) and obj is not BaseStrategy:
                    strategies.append({"name": name, "file": file})
    return strategies

@app.get("/api/wallet")
async def get_wallet():
    return wallet_manager.get_status()

@app.get("/api/wallet/history")
async def get_wallet_history():
    print("DEBUG: Fetching wallet history")
    return wallet_manager.get_history()

class FundRequest(BaseModel):
    amount: float
    reason: str = "Manual Adjustment"

@app.post("/api/wallet/deposit")
async def deposit_funds(req: FundRequest):
    balance = wallet_manager.add_funds(req.amount, req.reason)
    return {"status": "success", "balance": balance}

@app.post("/api/wallet/withdraw")
async def withdraw_funds(req: FundRequest):
    try:
        balance = wallet_manager.withdraw_funds(req.amount, req.reason)
        return {"status": "success", "balance": balance}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/api/reports")
async def list_reports():
    return report_manager.get_reports()

@app.get("/api/reports/{report_id}")
async def get_report(report_id: int):
    report = report_manager.get_report_details(report_id)
    if not report:
        return JSONResponse(status_code=404, content={"error": "Report not found"})
    return report

class SaveReportRequest(BaseModel):
    report_data: dict

@app.post("/api/reports/save")
async def save_report(req: SaveReportRequest):
    print(f"DEBUG: Saving report for strategy {req.report_data.get('parameters', {}).get('strategy')}")
    try:
        report_id = report_manager.save_report(req.report_data)
        return {"status": "success", "report_id": report_id}
    except Exception as e:
        print(f"ERROR saving report: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/history")
async def get_history(symbol: str = "BTCUSD", resolution: str = "1h"):
    # Resolution to seconds mapping
    res_map = {"5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400}
    seconds = res_map.get(resolution, 3600)
    
    # Fetch last 200 candles
    end_ts = int(datetime.now().timestamp())
    start_ts = end_ts - (200 * seconds) 
    
    df = delta_api.get_historical_data(symbol, resolution, start_ts, end_ts)
    if df.empty:
        return []
    
    # Drop rows with NaN or Inf to avoid frontend errors
    df = df.replace([float('inf'), float('-inf')], float('nan')).dropna()
    
    # Format for Lightweight Charts
    data = []
    for idx, row in df.iterrows():
        data.append({
            "time": int(idx.timestamp()),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"])
        })
    return data

@app.post("/api/backtest")
async def run_backtest(req: BacktestRequest):
    # Load strategy
    module_name = f"strategies.{req.strategy_name.lower()}"
    # This is a bit brittle, we might need a better mapping
    # Let's search for the class in all files in strategies/
    strategy_class = None
    for file in os.listdir("strategies"):
        if file.endswith(".py"):
            mod = importlib.import_module(f"strategies.{file[:-3]}")
            if hasattr(mod, req.strategy_name):
                strategy_class = getattr(mod, req.strategy_name)
                break
    
    if not strategy_class:
        return JSONResponse(status_code=400, content={"error": "Strategy not found"})

    strategy = strategy_class()
    
    # Fetch data
    start_ts = int(datetime.strptime(req.start_date, "%Y-%m-%d").timestamp())
    end_ts = int(datetime.strptime(req.end_date, "%Y-%m-%d").timestamp())
    
    df = delta_api.get_historical_data("BTCUSD", req.resolution, start_ts, end_ts)
    
    if df.empty:
        return JSONResponse(status_code=400, content={"error": "No data found for selected period"})

    engine = BacktestEngine(initial_capital=req.initial_capital)
    report = engine.run(strategy, df)
    
    return report

@app.get("/api/trade/active")
async def get_active_trades():
    return trade_manager.get_active_trades()

@app.get("/api/trade/history")
async def get_trade_history():
    return trade_manager.get_trade_history()

class OpenTradeRequest(BaseModel):
    side: str
    size: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

@app.post("/api/trade/open")
async def open_manual_trade(req: OpenTradeRequest):
    ticker = delta_api.get_ticker("BTCUSD")
    if not ticker:
        return JSONResponse(status_code=500, content={"error": "Could not fetch current price"})
    
    price = float(ticker['mark_price'])
    try:
        trade_id = trade_manager.open_trade("BTCUSD", req.side, price, req.size, req.stop_loss, req.take_profit, "MANUAL")
        return {"status": "success", "trade_id": trade_id}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/api/strategies/configs")
async def get_strategy_configs():
    from database.db import SessionLocal, StrategyConfig
    db = SessionLocal()
    configs = db.query(StrategyConfig).all()
    db.close()
    return configs

class StrategyConfigReq(BaseModel):
    name: str
    parameters: dict

@app.post("/api/strategies/configs")
async def save_strategy_config(req: StrategyConfigReq):
    from database.db import SessionLocal, StrategyConfig
    db = SessionLocal()
    config = db.query(StrategyConfig).filter(StrategyConfig.name == req.name).first()
    if config:
        config.parameters = json.dumps(req.parameters)
    else:
        config = StrategyConfig(name=req.name, parameters=json.dumps(req.parameters))
        db.add(config)
    db.commit()
    db.close()
    return {"status": "success"}

class CloseTradeRequest(BaseModel):
    trade_id: int

@app.post("/api/trade/close")
async def close_manual_trade(req: CloseTradeRequest):
    ticker = delta_api.get_ticker("BTCUSD")
    if not ticker:
        return JSONResponse(status_code=500, content={"error": "Could not fetch current price"})
    
    price = float(ticker['mark_price'])
    try:
        pnl = trade_manager.close_trade(req.trade_id, price, "Manual Exit")
        return {"status": "success", "pnl": pnl}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

from livetest.manager import live_test_manager

class LiveRequest(BaseModel):
    strategy_name: str
    lot_size: float

@app.post("/api/live/start")
async def start_live(req: LiveRequest):
    # Load strategy
    strategy_class = None
    for file in os.listdir("strategies"):
        if file.endswith(".py"):
            mod = importlib.import_module(f"strategies.{file[:-3]}")
            if hasattr(mod, req.strategy_name):
                strategy_class = getattr(mod, req.strategy_name)
                break
    
    if not strategy_class:
        return JSONResponse(status_code=400, content={"error": "Strategy not found"})

    await live_test_manager.start(strategy_class())
    return {"status": "Live testing started"}

@app.post("/api/live/stop")
async def stop_live():
    live_test_manager.stop()
    return {"status": "Live testing stopped"}

@app.get("/api/insights")
async def get_insights():
    try:
        data = {
            "fng": insights_manager.get_fear_greed_index(),
            "roi": insights_manager.get_roi_data(),
            "halving": insights_manager.get_halving_data(),
            "whale_alerts": insights_manager.get_whale_alerts()
        }
        return data
    except Exception as e:
        print(f"Error in /api/insights: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send live updates (ticker, active trades, etc.)
            ticker = delta_api.get_ticker("BTCUSD")
            if ticker:
                # Run live strategy
                trade_event = await live_test_manager.on_ticker(ticker)
                
                # Calculate real-time PnL for all active trades
                active_trades = trade_manager.get_active_trades()
                current_price = float(ticker['mark_price'])
                
                for trade in active_trades:
                    if trade['type'] == "BUY":
                        unrealized_pnl = (current_price - trade['entry_price']) * trade['size']
                    else:
                        unrealized_pnl = (trade['entry_price'] - current_price) * trade['size']
                    trade['unrealized_pnl'] = unrealized_pnl

                    # Check TP/SL
                    if trade['stop_loss']:
                        if (trade['type'] == 'BUY' and current_price <= trade['stop_loss']) or \
                           (trade['type'] == 'SELL' and current_price >= trade['stop_loss']):
                            trade_manager.close_trade(trade['id'], current_price, "Stop Loss")
                            trade_event = {"type": "trade_closed", "data": {"id": trade['id'], "reason": "Stop Loss"}}

                    if trade['take_profit']:
                        if (trade['type'] == 'BUY' and current_price >= trade['take_profit']) or \
                           (trade['type'] == 'SELL' and current_price <= trade['take_profit']):
                            trade_manager.close_trade(trade['id'], current_price, "Take Profit")
                            trade_event = {"type": "trade_closed", "data": {"id": trade['id'], "reason": "Take Profit"}}
                
                payload = {
                    "type": "ticker",
                    "data": ticker,
                    "active_trades": active_trades
                }
                if trade_event:
                    payload["event"] = trade_event
                
                await websocket.send_json(payload)
                
            await asyncio.sleep(0.5) # Faster updates
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
