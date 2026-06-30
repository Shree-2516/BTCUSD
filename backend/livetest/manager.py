import asyncio
import json
from datetime import datetime, timedelta
import pandas as pd
from backend.utils.delta_api import delta_api
from backend.database.db import SessionLocal, Trade, StrategySession
from backend.livetest.trade_manager import trade_manager
from backend.utils.logger import logger


class LiveTestManager:
    def __init__(self):
        self.active = False
        self.state = "WAITING"
        self.strategy = None
        self.strategy_name = None
        self.symbol = "BTCUSD"
        self.resolution = "1h"
        self.history = pd.DataFrame()
        self.active_trade_id = None
        self.lot_size = 0.1
        self.leverage = 1.0
        self.stop_loss = None
        self.take_profit = None
        self.trailing_stop = None
        self.cooldown_seconds = 0
        self.allow_hedging = False
        self._last_signal_id = None
        self._processed_signals = []
        self._last_entry_at = None
        self._lock = asyncio.Lock()
        self.session_id = None
        self.last_signal = None
        self.last_error = None
        self.last_evaluation = None
        self.last_candle_time = None
        self._runner_task = None
        self.last_event = None

    async def start(
        self,
        strategy,
        lot_size=0.1,
        resolution="1h",
        leverage=1.0,
        stop_loss=None,
        take_profit=None,
        trailing_stop=None,
        cooldown_seconds=0,
        allow_hedging=False,
    ):
        self.active = True
        self.state = "WAITING"
        self.strategy = strategy
        self.strategy_name = getattr(strategy, "name", strategy.__class__.__name__)
        self.resolution = getattr(strategy, "timeframe", None) or resolution
        self.lot_size = float(lot_size)
        self.leverage = max(float(leverage or 1.0), 1.0)
        self.stop_loss = stop_loss
        self.take_profit = take_profit
        self.trailing_stop = trailing_stop
        self.cooldown_seconds = int(cooldown_seconds or 0)
        self.allow_hedging = bool(allow_hedging)
        self.active_trade_id = None
        self._last_signal_id = None
        self._processed_signals = []
        self._last_entry_at = None
        self.last_signal = None
        self.last_error = None
        self.last_evaluation = None
        self.last_candle_time = None

        res_map = {"5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400}
        seconds = res_map.get(self.resolution, 3600)
        end_ts = int(datetime.now().timestamp())
        start_ts = end_ts - (200 * seconds)
        self.history = delta_api.get_historical_data(self.symbol, self.resolution, start_ts, end_ts)
        self._create_session()
        self._start_runner()
        logger.info(f"Live testing started with strategy: {self.strategy_name}")

    def stop(self):
        self.active = False
        self.state = "WAITING"
        self._stop_runner()
        self._stop_session()
        logger.info("Live testing stopped")

    def _start_runner(self):
        self._stop_runner()
        try:
            loop = asyncio.get_running_loop()
            self._runner_task = loop.create_task(self._run_loop())
        except RuntimeError:
            self._runner_task = None

    def _stop_runner(self):
        if self._runner_task and not self._runner_task.done():
            self._runner_task.cancel()
        self._runner_task = None

    async def _run_loop(self):
        while self.active:
            try:
                ticker = delta_api.get_ticker(self.symbol)
                if ticker:
                    event = await self.on_ticker(ticker)
                    if event:
                        self.last_event = event
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.last_error = str(e)
                logger.error(f"Live runner error: {e}")
            await asyncio.sleep(1)

    async def on_ticker(self, ticker_data):
        async with self._lock:
            if not self.active or not self.strategy:
                return None

            last_price = float(ticker_data.get("mark_price", ticker_data.get("close", 0)) or 0)
            if last_price <= 0:
                return None

            close_events = trade_manager.update_market_price(self.symbol, last_price)
            if close_events:
                self.active_trade_id = None
                self.state = "WAITING"
                self._reset_strategy_position()
                return {"type": "trade_closed", "data": {"price": last_price, **close_events[-1]}}

            current_ts = self._current_candle_time()
            if self.last_candle_time != current_ts.isoformat():
                logger.info(f"[NEW CANDLE] Started processing {current_ts.isoformat()}")

            self._update_history(current_ts, last_price)
            self.last_candle_time = current_ts.isoformat()

            try:
                signal = self.strategy.on_bar(self.history.iloc[-1], self.history.iloc[:-1])
            except Exception as e:
                logger.error(f"Live strategy execution failed: {e}")
                return self._error_event(f"Strategy execution failed: {e}")

            signal = self._normalize_signal(signal)
            self._record_evaluation(signal, last_price, current_ts)
            
            if not signal:
                return None

            signal_id = f"{self.strategy_name}:{self.symbol}:{current_ts.isoformat()}:{signal}"
            if self._is_duplicate_signal(signal_id, signal):
                logger.info(f"[DUPLICATE SIGNAL SKIPPED] {signal_id}")
                return None

            logger.info(f"[SIGNAL GENERATED] {signal_id}")

            if signal in {"BUY", "SELL"}:
                return self._handle_entry_signal(signal, last_price, current_ts, signal_id)

            if signal in {"EXIT_BUY", "EXIT_LONG", "EXIT_SELL", "EXIT_SHORT", "EXIT"}:
                return self._handle_exit_signal(signal, last_price)

            return None

    def _handle_entry_signal(self, side, price, candle_time, signal_id):
        if self._in_cooldown():
            logger.info(f"Live signal ignored during cooldown: {signal_id}")
            return None

        active_trade = self._get_active_trade()
        if active_trade:
            if active_trade.type != side:
                pnl = trade_manager.close_trade(active_trade.id, price, "Reverse Signal")
                self.active_trade_id = None
                self.state = "WAITING"
                return {
                    "type": "trade_closed",
                    "data": {"id": active_trade.id, "price": price, "pnl": pnl, "reason": "Reverse Signal"},
                }
            return None

        try:
            trade_id = trade_manager.open_trade(
                self.symbol,
                side,
                price,
                self.lot_size,
                stop_loss=self.stop_loss,
                take_profit=self.take_profit,
                trade_type="LIVE",
                strategy_name=self.strategy_name,
                leverage=self.leverage,
                signal_id=signal_id,
                candle_time=candle_time,
                allow_hedging=self.allow_hedging,
                trailing_stop=self.trailing_stop,
            )
            self.active_trade_id = trade_id
            self.state = "OPEN"
            self._last_signal_id = signal_id
            self._processed_signals.append(signal_id)
            if len(self._processed_signals) > 20:
                self._processed_signals.pop(0)
            self._last_entry_at = datetime.utcnow()
            self._update_session_state("OPEN")
            self.last_error = None
            logger.info(f"[TRADE OPENED] #{trade_id} {side} at {price}")
            return {
                "type": "trade_opened",
                "data": {"id": trade_id, "type": side, "price": price, "strategy": self.strategy_name},
            }
        except Exception as e:
            self._reset_strategy_position()
            self.last_error = str(e)
            return self._error_event(f"{side} signal matched, but trade was not opened: {e}", side)

    def _handle_exit_signal(self, signal, price):
        active_trade = self._get_active_trade()
        if not active_trade:
            if self.active_trade_id:
                logger.info("Active trade not found in DB but manager state is OPEN. Resetting state.")
                self.active_trade_id = None
                self.state = "WAITING"
                self._update_session_state("WAITING")
                self._reset_strategy_position()
            return None
        if signal in {"EXIT_BUY", "EXIT_LONG"} and active_trade.type != "BUY":
            return None
        if signal in {"EXIT_SELL", "EXIT_SHORT"} and active_trade.type != "SELL":
            return None
        try:
            pnl = trade_manager.close_trade(active_trade.id, price, "Strategy Exit")
            self.active_trade_id = None
            self.state = "WAITING"
            self._update_session_state("WAITING")
            self._reset_strategy_position()
            logger.info(f"[TRADE CLOSED] #{active_trade.id} at {price} PnL: {pnl}")
            logger.info("[WAITING FOR NEXT SIGNAL] State reset completed.")
            return {
                "type": "trade_closed",
                "data": {"id": active_trade.id, "price": price, "pnl": pnl, "reason": "Strategy Exit"},
            }
        except Exception as e:
            return self._error_event(f"Exit signal matched, but trade was not closed: {e}", signal)

    def _update_history(self, current_ts, last_price):
        temp_history = self.history.copy()
        if temp_history.empty:
            temp_history = pd.DataFrame([{
                "open": last_price, "high": last_price, "low": last_price, "close": last_price, "volume": 0
            }], index=[current_ts])
        elif current_ts in temp_history.index:
            temp_history.at[current_ts, "close"] = last_price
            temp_history.at[current_ts, "high"] = max(float(temp_history.at[current_ts, "high"]), last_price)
            temp_history.at[current_ts, "low"] = min(float(temp_history.at[current_ts, "low"]), last_price)
        else:
            new_row = pd.DataFrame([{
                "open": last_price, "high": last_price, "low": last_price, "close": last_price, "volume": 0
            }], index=[current_ts])
            temp_history = pd.concat([temp_history, new_row])
        self.history = temp_history.tail(250)

    def _normalize_signal(self, signal):
        if not signal:
            return None
        signal = str(signal).upper()
        return {"LONG": "BUY", "SHORT": "SELL"}.get(signal, signal)

    def _is_duplicate_signal(self, signal_id, signal):
        if signal_id in self._processed_signals:
            return True
        return False

    def _in_cooldown(self):
        if not self._last_entry_at or self.cooldown_seconds <= 0:
            return False
        return datetime.utcnow() - self._last_entry_at < timedelta(seconds=self.cooldown_seconds)

    def _get_active_trade(self):
        db = SessionLocal()
        try:
            query = db.query(Trade).filter(
                Trade.symbol == self.symbol,
                Trade.status == "OPEN",
                Trade.strategy_name == self.strategy_name,
            )
            return query.first()
        finally:
            db.close()

    def _error_event(self, message, signal=None):
        logger.error(message)
        self.last_error = message
        return {"type": "error", "data": {"message": message, "signal": signal}}

    def _record_evaluation(self, signal, price, candle_time):
        history = self.history.iloc[:-1] if not self.history.empty else self.history
        last_two = []
        if history is not None and len(history) >= 2:
            for _, row in history.tail(2).iterrows():
                candle_type = "BULLISH" if float(row["close"]) > float(row["open"]) else "BEARISH" if float(row["close"]) < float(row["open"]) else "DOJI"
                last_two.append({
                    "open": float(row["open"]),
                    "close": float(row["close"]),
                    "type": candle_type,
                })
        self.last_signal = signal
        self.last_evaluation = {
            "time": datetime.utcnow().isoformat() + "Z",
            "candle_time": candle_time.isoformat(),
            "price": price,
            "signal": signal,
            "last_two_closed": last_two,
            "history_rows": int(len(self.history)),
        }

    def get_status(self):
        return {
            "active": self.active,
            "state": self.state,
            "strategy_name": self.strategy_name,
            "symbol": self.symbol,
            "resolution": self.resolution,
            "lot_size": self.lot_size,
            "leverage": self.leverage,
            "active_trade_id": self.active_trade_id,
            "last_signal": self.last_signal,
            "last_error": self.last_error,
            "last_evaluation": self.last_evaluation,
            "last_candle_time": self.last_candle_time,
            "last_event": self.last_event,
        }

    def consume_event(self):
        event = self.last_event
        self.last_event = None
        return event

    def _reset_strategy_position(self):
        if hasattr(self.strategy, "position"):
            self.strategy.position = None
        if hasattr(self.strategy, "pending_exit"):
            self.strategy.pending_exit = None

    def _current_candle_time(self):
        res_map = {"5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400}
        seconds = res_map.get(self.resolution, 3600)
        now_ts = int(datetime.now().timestamp())
        return datetime.fromtimestamp((now_ts // seconds) * seconds)

    def _create_session(self):
        db = SessionLocal()
        try:
            session = StrategySession(
                strategy_name=self.strategy_name,
                symbol=self.symbol,
                status="WAITING",
                config=json.dumps({
                    "lot_size": self.lot_size,
                    "leverage": self.leverage,
                    "resolution": self.resolution,
                    "stop_loss": self.stop_loss,
                    "take_profit": self.take_profit,
                    "trailing_stop": self.trailing_stop,
                    "cooldown_seconds": self.cooldown_seconds,
                }),
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            self.session_id = session.id
        except Exception as e:
            db.rollback()
            logger.error(f"Strategy session create failed: {e}")
        finally:
            db.close()

    def _update_session_state(self, state):
        if not self.session_id:
            return
        db = SessionLocal()
        try:
            session = db.query(StrategySession).filter(StrategySession.id == self.session_id).first()
            if session:
                session.status = state
                db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Strategy session update failed: {e}")
        finally:
            db.close()

    def _stop_session(self):
        if not self.session_id:
            return
        db = SessionLocal()
        try:
            session = db.query(StrategySession).filter(StrategySession.id == self.session_id).first()
            if session:
                session.status = "STOPPED"
                session.stopped_at = datetime.utcnow()
                db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Strategy session stop failed: {e}")
        finally:
            db.close()


live_test_manager = LiveTestManager()
