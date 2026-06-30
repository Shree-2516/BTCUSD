from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, Response, FileResponse
from pydantic import BaseModel
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import importlib
import inspect
from datetime import datetime, timedelta
import asyncio
import json
from typing import Optional
from contextlib import asynccontextmanager
import warnings

warnings.filterwarnings(
    "ignore",
    message=r".*If you are loading a serialized model.*",
    category=UserWarning,
)

from backend.utils.delta_api import delta_api
from backend.wallet.manager import wallet_manager
from backend.report.manager import report_manager
from backend.backtest.engine import BacktestEngine
from backend.strategies.base_strategy import BaseStrategy
from backend.database.db import init_db
from backend.livetest.trade_manager import trade_manager
from backend.insights.manager import insights_manager
from backend.insights.prediction_engine import prediction_engine
from backend.insights.layered_engine import layered_prediction_engine
from backend.livetest.metrics_tracker import metrics_tracker
from backend.utils.logger import logger

# Import news models so they are registered on Base before init_db
from backend.NEWS.storage.news_repository import NewsArticle, MarketSentimentModel
from backend.NEWS.routes.news_routes import news_router
from backend.NEWS.services.scheduler import news_scheduler_loop
from backend.NEWS.services.summarizer import news_summary_loop


# Initialize database
try:
    init_db()
except Exception as e:
    print(f"CRITICAL: Database initialization failed: {e}")
    # We continue so the app starts, but functionality will be limited

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Background tasks for metrics tracking and news sentiment aggregation."""
    async def metrics_loop():
        while True:
            try:
                ticker = delta_api.get_ticker("BTCUSD")
                if ticker:
                    metrics_tracker.update_metrics(float(ticker['mark_price']))
            except Exception as e:
                print(f"Metrics Loop Error: {e}")
            await asyncio.sleep(60)

    async def predictions_loop():
        from backend.database.db import SessionLocal, CachedPrediction
        while True:
            try:
                # Run layered prediction for Daily (default BTCUSD)
                pred_data = await asyncio.to_thread(layered_prediction_engine.get_layered_prediction, "BTCUSD")
                
                # Run advanced predictions for Weekly/Monthly
                adv_data = await asyncio.to_thread(insights_manager.get_advanced_predictions, "BTCUSD")
                
                db = SessionLocal()
                try:
                    # Cache Daily
                    daily_cache = db.query(CachedPrediction).filter_by(symbol="BTCUSD", horizon="DAILY").first()
                    if daily_cache:
                        daily_cache.prediction_data = json.dumps(pred_data)
                    else:
                        db.add(CachedPrediction(symbol="BTCUSD", horizon="DAILY", prediction_data=json.dumps(pred_data)))
                    
                    # Cache Weekly/Monthly from adv_data
                    weekly_cache = db.query(CachedPrediction).filter_by(symbol="BTCUSD", horizon="WEEKLY").first()
                    if weekly_cache:
                        weekly_cache.prediction_data = json.dumps(adv_data.get("next_week", {}))
                    else:
                        db.add(CachedPrediction(symbol="BTCUSD", horizon="WEEKLY", prediction_data=json.dumps(adv_data.get("next_week", {}))))

                    monthly_cache = db.query(CachedPrediction).filter_by(symbol="BTCUSD", horizon="MONTHLY").first()
                    if monthly_cache:
                        monthly_cache.prediction_data = json.dumps(adv_data.get("next_month", {}))
                    else:
                        db.add(CachedPrediction(symbol="BTCUSD", horizon="MONTHLY", prediction_data=json.dumps(adv_data.get("next_month", {}))))
                    
                    db.commit()
                except Exception as db_e:
                    logger.error(f"Error saving predictions to DB: {db_e}")
                    db.rollback()
                finally:
                    db.close()
                    
            except Exception as e:
                logger.error(f"Predictions Loop Error: {e}")
            await asyncio.sleep(900) # Run every 15 minutes

    metrics_task = asyncio.create_task(metrics_loop())
    news_task = asyncio.create_task(news_scheduler_loop())
    summary_task = asyncio.create_task(news_summary_loop())
    predictions_task = asyncio.create_task(predictions_loop())
    try:
        yield
    finally:
        metrics_task.cancel()
        news_task.cancel()
        summary_task.cancel()
        predictions_task.cancel()

app = FastAPI(title="BTCUSD Trading Dashboard", lifespan=lifespan)

# Register news routes
app.include_router(news_router)

# Ensure static folder exists
os.makedirs(os.path.join(os.path.dirname(__file__), "static"), exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
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



@app.get("/")
async def get_dashboard():
    return {"message": "BTCUSD Trading API is running. Please use the React frontend on port 5173."}

def iter_strategy_modules():
    for file in os.listdir(os.path.join(os.path.dirname(__file__), "strategies")):
        if not file.endswith(".py") or file == "base_strategy.py" or file.startswith("_"):
            continue
        yield file, importlib.import_module(f"backend.strategies.{file[:-3]}")

def find_strategy_class(strategy_name: str):
    for _, module in iter_strategy_modules():
        for _, obj in inspect.getmembers(module):
            if (
                inspect.isclass(obj)
                and issubclass(obj, BaseStrategy)
                and obj is not BaseStrategy
                and obj.__name__ == strategy_name
            ):
                return obj
    return None

@app.get("/api/strategies")
async def list_strategies():
    strategies = []
    for file, module in iter_strategy_modules():
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, BaseStrategy) and obj is not BaseStrategy:
                strategies.append({"name": name, "file": file})
    return strategies

@app.get("/api/wallet")
async def get_wallet():
    return wallet_manager.get_status()

@app.get("/api/wallet/history")
async def get_wallet_history():
    return wallet_manager.get_history()

@app.get("/api/wallet/transactions")
async def get_wallet_transactions(limit: int = 100, type: str = "ALL"):
    return wallet_manager.get_wallet_transactions(limit=limit, tx_type=type)

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

@app.post("/api/wallet/reset")
async def reset_wallet():
    success = wallet_manager.reset_wallet()
    if success:
        return {"status": "success", "message": "Wallet reset successfully"}
    else:
        return JSONResponse(status_code=500, content={"error": "Failed to reset wallet"})

@app.get("/api/reports")
async def list_reports():
    return report_manager.get_reports()

@app.get("/api/live/report")
async def get_live_report():
    return report_manager.get_live_report()

@app.get("/api/reports/live/summaries")
async def get_live_summaries():
    return report_manager.get_live_summaries()

@app.get("/api/reports/portfolio")
async def get_portfolio_summary():
    return report_manager.get_portfolio_summary()

@app.get("/api/reports/{report_id}")
async def get_report(report_id: int):
    report = report_manager.get_report_details(report_id)
    if not report:
        return JSONResponse(status_code=404, content={"error": "Report not found"})
    return report

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int):
    deleted = report_manager.delete_report(report_id)
    if not deleted:
        return JSONResponse(status_code=404, content={"error": "Report not found"})
    return {"status": "success"}

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

@app.get("/api/reports/{report_id}/export/{format}")
async def export_report(report_id: int, format: str):
    from fastapi.responses import StreamingResponse
    import io

    try:
        data = report_manager.export_report(report_id, format)
        if data is None:
            return JSONResponse(status_code=404, content={"error": "Report not found or invalid format"})
        
        if isinstance(data, str):
            data = data.encode('utf-8')
            
        if format == 'csv':
            return StreamingResponse(
                io.BytesIO(data),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=report_{report_id}.csv",
                    "Content-Length": str(len(data))
                }
            )
        elif format == 'excel':
            return StreamingResponse(
                io.BytesIO(data),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename=report_{report_id}.xlsx",
                    "Content-Length": str(len(data))
                }
            )
        return JSONResponse(status_code=400, content={"error": "Unsupported format"})
    except Exception as e:
        print(f"ERROR exporting report: {e}")
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
            "time": int(getattr(idx, "timestamp")()),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"])
        })
    return data

@app.post("/api/backtest")
async def run_backtest(req: BacktestRequest):
    strategy_class = find_strategy_class(req.strategy_name)
    
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
    report = await asyncio.to_thread(engine.run, strategy, df)

    if isinstance(report, dict) and report.get("error") is None:
        params = report.setdefault("parameters", {})
        params["start_date"] = req.start_date
        params["end_date"] = req.end_date
        params["resolution"] = req.resolution

    return report

@app.get("/api/trade/active")
async def get_active_trades():
    return trade_manager.get_active_trades()

@app.get("/api/trade/history")
async def get_trade_history():
    return trade_manager.get_trade_history()

@app.delete("/api/trade/{trade_id}")
async def delete_trade(trade_id: int):
    try:
        deleted = trade_manager.delete_trade(trade_id)
        if not deleted:
            return JSONResponse(status_code=404, content={"error": "Trade not found"})
        return {"status": "success"}
    except Exception as e:
        from backend.utils.logger import logger
        logger.error(f"Failed to delete trade: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/strategies/configs")
async def get_strategy_configs():
    from backend.database.db import SessionLocal, StrategyConfig
    db = SessionLocal()
    configs = db.query(StrategyConfig).all()
    db.close()
    return configs

class StrategyConfigReq(BaseModel):
    name: str
    parameters: dict

@app.post("/api/strategies/configs")
async def save_strategy_config(req: StrategyConfigReq):
    from backend.database.db import SessionLocal, StrategyConfig
    db = SessionLocal()
    config = db.query(StrategyConfig).filter(StrategyConfig.name == req.name).first()
    if config:
        setattr(config, "parameters", json.dumps(req.parameters))
    else:
        config = StrategyConfig(name=req.name, parameters=json.dumps(req.parameters))
        db.add(config)
    db.commit()
    db.close()
    return {"status": "success"}


from backend.livetest.manager import live_test_manager

class LiveRequest(BaseModel):
    strategy_name: str
    lot_size: float
    leverage: float = 10.0
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    trailing_stop: Optional[float] = None
    cooldown_seconds: int = 0
    allow_hedging: bool = False

@app.post("/api/live/start")
async def start_live(req: LiveRequest):
    if live_test_manager.active:
        return {"status": "Live testing already running", "live": live_test_manager.get_status()}

    strategy_class = find_strategy_class(req.strategy_name)
    
    if not strategy_class:
        return JSONResponse(status_code=400, content={"error": "Strategy not found"})

    ticker = delta_api.get_ticker("BTCUSD")
    current_price = 0.0
    if ticker:
        current_price = float(ticker.get("mark_price") or ticker.get("close") or 0)
    if current_price <= 0:
        end_ts = int(datetime.now().timestamp())
        df = delta_api.get_historical_data("BTCUSD", getattr(strategy_class(), "timeframe", "5m"), end_ts - (20 * 300), end_ts)
        if not df.empty:
            current_price = float(df.iloc[-1]["close"])

    if current_price <= 0:
        return JSONResponse(status_code=503, content={"error": "Live BTCUSD price unavailable. Cannot start paper trading safely."})

    wallet = wallet_manager.get_status()
    leverage = max(req.leverage or 1.0, 1.0)
    required = (current_price * req.lot_size) / leverage
    if required > wallet.get("available_balance", 0):
        return JSONResponse(
            status_code=400,
            content={
                "error": (
                    f"Insufficient paper margin. {req.lot_size} BTC at {leverage:g}x needs about "
                    f"{required:.2f} USDT, available {wallet.get('available_balance', 0):.2f} USDT. "
                    f"Increase leverage, reduce position size, or add virtual funds."
                )
            }
        )

    await live_test_manager.start(
        strategy_class(),
        lot_size=req.lot_size,
        leverage=req.leverage,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
        trailing_stop=req.trailing_stop,
        cooldown_seconds=req.cooldown_seconds,
        allow_hedging=req.allow_hedging,
    )
    return {"status": "Live testing started", "live": live_test_manager.get_status()}

@app.post("/api/live/stop")
async def stop_live():
    live_test_manager.stop()
    return {"status": "Live testing stopped"}

@app.get("/api/live/status")
async def get_live_status():
    return live_test_manager.get_status()

@app.post("/api/trade/{trade_id}/close")
async def close_trade_manual(trade_id: int):
    try:
        ticker = delta_api.get_ticker("BTCUSD")
        current_price = float((ticker or {}).get("mark_price") or (ticker or {}).get("close") or 0)
        if current_price <= 0:
            return JSONResponse(status_code=503, content={"error": "Live market price unavailable"})
        pnl = trade_manager.close_trade(trade_id, current_price, "Manual Exit")
        
        if live_test_manager.active and live_test_manager.active_trade_id == trade_id:
            logger.info("Manual close detected for active live trade. Resetting live manager state.")
            live_test_manager.active_trade_id = None
            live_test_manager.state = "WAITING"
            live_test_manager._reset_strategy_position()
            
        return {"status": "success", "trade_id": trade_id, "exit_price": current_price, "pnl": pnl}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        logger.error(f"Manual close failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

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

@app.get("/api/ai-insights")
async def get_ai_insights():
    """Layered AI Prediction and advanced analytics endpoint"""
    try:
        from backend.database.db import SessionLocal, CachedPrediction
        db = SessionLocal()
        cache = db.query(CachedPrediction).filter_by(symbol="BTCUSD", horizon="DAILY").first()
        db.close()
        if cache and cache.prediction_data:
            return json.loads(cache.prediction_data)
            
        # Fallback if cache is empty
        prediction = await asyncio.to_thread(layered_prediction_engine.get_layered_prediction, "BTCUSD")
        return prediction
    except Exception as e:
        print(f"Layered Engine Error: {e}")
        return {"error": str(e), "trend": "ERROR", "confidence": 0}

@app.get("/ai/advanced-prediction")
async def get_advanced_prediction():
    """Returns structured multi-timeframe AI forecasts"""
    try:
        from backend.database.db import SessionLocal, CachedPrediction
        db = SessionLocal()
        weekly = db.query(CachedPrediction).filter_by(symbol="BTCUSD", horizon="WEEKLY").first()
        monthly = db.query(CachedPrediction).filter_by(symbol="BTCUSD", horizon="MONTHLY").first()
        db.close()
        
        result = {}
        if weekly and weekly.prediction_data:
            result["next_week"] = json.loads(weekly.prediction_data)
        if monthly and monthly.prediction_data:
            result["next_month"] = json.loads(monthly.prediction_data)
            
        if result:
            return result
            
        # Fallback
        return await asyncio.to_thread(insights_manager.get_advanced_predictions, "BTCUSD")
    except Exception as e:
        from backend.utils.logger import logger
        logger.error(f"Advanced Prediction Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send live updates (ticker, active trades, etc.)
            ticker = delta_api.get_ticker("BTCUSD")
            if ticker:
                # Live strategy execution is owned by LiveTestManager's background loop.
                trade_event = live_test_manager.consume_event()
                
                # Calculate real-time PnL for all active trades
                active_trades = trade_manager.get_active_trades()
                current_price = float(ticker['mark_price'])
                wallet = wallet_manager.get_status()
                
                payload = {
                    "type": "ticker",
                    "data": ticker,
                    "active_trades": active_trades,
                    "wallet": wallet,
                    "live_state": live_test_manager.state,
                    "live_status": live_test_manager.get_status()
                }
                if trade_event:
                    payload["event"] = trade_event
                
                await websocket.send_json(payload)
                
            await asyncio.sleep(0.5) # Faster updates
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.getenv("BTCUSD_RELOAD", "").lower() in {"1", "true", "yes"}
    print("BTCUSD Dashboard running at http://localhost:8000")
    if reload_enabled:
        print("Auto-reload enabled")
    try:
        uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=reload_enabled, log_level="warning")
    except Exception as e:
        if "10048" in str(e) or "already in use" in str(e):
            print("\n" + "="*60)
            print("CRITICAL ERROR: Port 8000 is already in use!")
            print("Another instance of the BTCUSD Dashboard is likely running.")
            print("Please close it before starting a new one.")
            print("="*60 + "\n")
        else:
            raise
