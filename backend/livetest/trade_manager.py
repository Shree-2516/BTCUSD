from backend.database.db import SessionLocal, Trade, TradeHistory, LiveTradeSnapshot, EquityCurvePoint, Wallet, WalletTransaction
from datetime import datetime
from backend.wallet.manager import wallet_manager
from backend.utils.logger import logger
import sqlalchemy as sa
import threading


class TradeManager:
    def __init__(self):
        self._lock = threading.RLock()

    def get_session(self):
        return SessionLocal()

    @staticmethod
    def normalize_side(side):
        side = (side or "").upper()
        if side == "LONG":
            return "BUY"
        if side == "SHORT":
            return "SELL"
        if side not in {"BUY", "SELL"}:
            raise ValueError(f"Unsupported trade side: {side}")
        return side

    @staticmethod
    def calculate_pnl(side, entry_price, current_price, quantity):
        if side == "BUY":
            return (current_price - entry_price) * quantity
        return (entry_price - current_price) * quantity

    def has_active_trade(self, symbol="BTCUSD", strategy_name=None):
        db = self.get_session()
        try:
            query = db.query(Trade).filter(Trade.symbol == symbol, Trade.status == "OPEN")
            if strategy_name:
                query = query.filter(Trade.strategy_name == strategy_name)
            return query.first() is not None
        finally:
            db.close()

    def open_trade(
        self,
        symbol,
        side,
        price,
        size,
        stop_loss=None,
        take_profit=None,
        trade_type="MANUAL",
        strategy_name=None,
        leverage=1.0,
        signal_id=None,
        candle_time=None,
        allow_hedging=False,
        trailing_stop=None,
    ):
        with self._lock:
            db = self.get_session()
            reserved_margin = 0.0
            try:
                side = self.normalize_side(side)
                price = float(price)
                size = float(size)
                leverage = max(float(leverage or 1.0), 1.0)
                if price <= 0 or size <= 0:
                    raise ValueError("Price and quantity must be positive")

                if signal_id:
                    existing_signal = db.query(Trade).filter(Trade.signal_id == signal_id).first()
                    if existing_signal:
                        logger.info(f"Duplicate signal ignored: {signal_id}")
                        return existing_signal.id

                if not allow_hedging:
                    query = db.query(Trade).filter(Trade.symbol == symbol, Trade.status == "OPEN")
                    if strategy_name:
                        query = query.filter(Trade.strategy_name == strategy_name)
                    if query.first():
                        raise ValueError(f"Active trade already exists for {strategy_name or 'manual'} {symbol}")

                position_size = price * size
                margin_used = position_size / leverage
                trade = Trade(
                    symbol=symbol,
                    type=side,
                    strategy_name=strategy_name,
                    entry_price=price,
                    current_price=price,
                    highest_price=price,
                    lowest_price=price,
                    size=size,
                    leverage=leverage,
                    margin_used=margin_used,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    trailing_stop=trailing_stop,
                    status="OPEN",
                    state="OPEN",
                    trade_type=trade_type,
                    entry_time=datetime.utcnow(),
                    signal_id=signal_id,
                    last_candle_time=candle_time,
                )
                db.add(trade)
                db.flush()

                wallet_manager.reserve_margin(
                    margin_used,
                    f"Reserve margin for {trade_type} {side} {size} {symbol} x{leverage:g}",
                    trade_id=trade.id,
                )
                reserved_margin = margin_used

                self._upsert_live_snapshot(db, trade)
                db.commit()
                logger.info(f"Opened paper trade #{trade.id}: {side} {size} {symbol} @ {price}")
                return trade.id
            except Exception as e:
                db.rollback()
                if reserved_margin:
                    try:
                        wallet_manager.settle_trade(
                            reserved_margin,
                            0.0,
                            f"Release margin after failed open {trade_type} {side} {size} {symbol}",
                        )
                    except Exception as release_error:
                        logger.error(f"Failed to release margin after open error: {release_error}")
                logger.error(f"Open trade failed: {e}")
                raise
            finally:
                db.close()

    def close_trade(self, trade_id, exit_price, reason="Manual"):
        with self._lock:
            db = self.get_session()
            try:
                trade = db.query(Trade).filter(Trade.id == trade_id, Trade.status == "OPEN").first()
                if not trade:
                    raise ValueError("Trade not found or already closed")

                exit_price = float(exit_price)
                pnl = self.calculate_pnl(trade.type, trade.entry_price, exit_price, trade.size)
                pnl_pct = (pnl / (trade.entry_price * trade.size)) * 100 if trade.entry_price and trade.size else 0.0
                roi = (pnl / trade.margin_used) * 100 if trade.margin_used else pnl_pct
                exit_time = datetime.utcnow()
                duration = (exit_time - trade.entry_time).total_seconds() if trade.entry_time else 0.0

                wallet_balance = wallet_manager.settle_trade(
                    trade.margin_used or 0.0,
                    pnl,
                    f"Settle {trade.trade_type} {trade.type} {trade.size} {trade.symbol} ({reason})",
                    trade_id=trade.id,
                )

                trade.status = "CLOSED"
                trade.state = "CLOSED"
                trade.exit_price = exit_price
                trade.exit_time = exit_time
                trade.current_price = exit_price
                trade.pnl = pnl
                trade.unrealized_pnl = 0.0
                trade.pnl_percentage = pnl_pct
                trade.roi = roi
                trade.exit_reason = reason
                trade.wallet_balance_after = wallet_balance

                db.query(LiveTradeSnapshot).filter(LiveTradeSnapshot.trade_id == trade.id).update({
                    "status": "CLOSED",
                    "current_price": exit_price,
                    "unrealized_pnl": 0.0,
                    "updated_at": datetime.utcnow(),
                })
                db.add(TradeHistory(
                    trade_id=trade.id,
                    symbol=trade.symbol,
                    strategy_name=trade.strategy_name,
                    side=trade.type,
                    quantity=trade.size,
                    leverage=trade.leverage,
                    entry_price=trade.entry_price,
                    exit_price=exit_price,
                    entry_time=trade.entry_time,
                    exit_time=exit_time,
                    pnl=pnl,
                    pnl_percentage=pnl_pct,
                    duration_seconds=duration,
                    stop_loss=trade.stop_loss,
                    take_profit=trade.take_profit,
                    exit_reason=reason,
                    fees=trade.fees or 0.0,
                    wallet_balance_after=wallet_balance,
                ))
                self._record_equity_point(db)
                db.commit()
                logger.info(f"Closed paper trade #{trade.id}: pnl={pnl:.2f}, reason={reason}")
                return pnl
            except Exception as e:
                db.rollback()
                logger.error(f"Close trade failed for #{trade_id}: {e}")
                raise
            finally:
                db.close()

    def update_market_price(self, symbol, current_price):
        db = self.get_session()
        closed_events = []
        try:
            current_price = float(current_price)
            trades = db.query(Trade).filter(Trade.symbol == symbol, Trade.status == "OPEN").all()
            total_unrealized = 0.0
            for trade in trades:
                pnl = self.calculate_pnl(trade.type, trade.entry_price, current_price, trade.size)
                position_size = trade.entry_price * trade.size
                pnl_pct = (pnl / position_size) * 100 if position_size else 0.0
                roi = (pnl / trade.margin_used) * 100 if trade.margin_used else pnl_pct
                previous_drawdown = float(trade.max_drawdown or 0.0)
                drawdown = min(previous_drawdown, pnl)

                trade.current_price = current_price
                trade.unrealized_pnl = pnl
                trade.pnl_percentage = pnl_pct
                trade.roi = roi
                trade.max_drawdown = drawdown
                trade.highest_price = max(float(trade.highest_price or current_price), current_price)
                trade.lowest_price = min(float(trade.lowest_price or current_price), current_price)
                total_unrealized += pnl
                self._upsert_live_snapshot(db, trade)

            db.commit()
            wallet_manager.update_unrealized_pnl(total_unrealized)

            for trade in trades:
                reason = self._exit_reason_for_trade(trade, current_price)
                if reason:
                    pnl = self.close_trade(trade.id, current_price, reason)
                    closed_events.append({"id": trade.id, "reason": reason, "pnl": pnl})
            return closed_events
        except Exception as e:
            db.rollback()
            logger.error(f"Market price update failed: {e}")
            return closed_events
        finally:
            db.close()

    def _exit_reason_for_trade(self, trade, current_price):
        if trade.stop_loss:
            if trade.type == "BUY" and current_price <= trade.stop_loss:
                return "Stop Loss"
            if trade.type == "SELL" and current_price >= trade.stop_loss:
                return "Stop Loss"
        if trade.take_profit:
            if trade.type == "BUY" and current_price >= trade.take_profit:
                return "Take Profit"
            if trade.type == "SELL" and current_price <= trade.take_profit:
                return "Take Profit"
        if trade.trailing_stop:
            trailing = float(trade.trailing_stop)
            if trade.type == "BUY" and trade.highest_price and current_price <= float(trade.highest_price) - trailing:
                return "Trailing Stop"
            if trade.type == "SELL" and trade.lowest_price and current_price >= float(trade.lowest_price) + trailing:
                return "Trailing Stop"
        return None

    def _upsert_live_snapshot(self, db, trade):
        snapshot = db.query(LiveTradeSnapshot).filter(LiveTradeSnapshot.trade_id == trade.id).first()
        if not snapshot:
            snapshot = LiveTradeSnapshot(trade_id=trade.id)
            db.add(snapshot)
        snapshot.symbol = trade.symbol
        snapshot.strategy_name = trade.strategy_name
        snapshot.side = trade.type
        snapshot.entry_price = trade.entry_price
        snapshot.current_price = trade.current_price or trade.entry_price
        snapshot.quantity = trade.size
        snapshot.leverage = trade.leverage or 1.0
        snapshot.margin_used = trade.margin_used or 0.0
        snapshot.unrealized_pnl = trade.unrealized_pnl or 0.0
        snapshot.pnl_percentage = trade.pnl_percentage or 0.0
        snapshot.roi = trade.roi or 0.0
        snapshot.drawdown = trade.max_drawdown or 0.0
        snapshot.status = trade.status
        snapshot.updated_at = datetime.utcnow()

    def _record_equity_point(self, db):
        wallet = db.query(Wallet).first()
        if not wallet:
            return
        db.add(EquityCurvePoint(
            balance=wallet.balance,
            equity=(wallet.balance or 0.0) + (wallet.unrealized_pnl or 0.0),
            available_balance=wallet.available_balance,
            used_margin=wallet.used_margin or 0.0,
            unrealized_pnl=wallet.unrealized_pnl or 0.0,
            realized_pnl=wallet.realized_pnl or 0.0,
        ))

    def get_active_trades(self):
        db = self.get_session()
        try:
            trades = db.query(Trade).filter(Trade.status == "OPEN").order_by(sa.desc(Trade.entry_time)).all()
            return [self._serialize_trade(t, open_trade=True) for t in trades]
        finally:
            db.close()

    def get_trade_history(self, limit=50):
        db = self.get_session()
        try:
            trades = db.query(Trade).filter(Trade.status == "CLOSED").order_by(sa.desc(Trade.exit_time)).limit(limit).all()
            return [self._serialize_trade(t, open_trade=False) for t in trades]
        finally:
            db.close()

    def delete_trade(self, trade_id):
        with self._lock:
            db = self.get_session()
            try:
                trade = db.query(Trade).filter(Trade.id == trade_id).first()
                if not trade:
                    return False
                
                # Delete related snapshots, history entries, and transactions (if any)
                db.query(LiveTradeSnapshot).filter(LiveTradeSnapshot.trade_id == trade_id).delete()
                db.query(TradeHistory).filter(TradeHistory.trade_id == trade_id).delete()
                db.query(WalletTransaction).filter(WalletTransaction.trade_id == trade_id).delete()
                
                db.delete(trade)
                db.commit()
                logger.info(f"Deleted trade #{trade_id} from database")
                return True
            except Exception as e:
                db.rollback()
                logger.error(f"Delete trade failed for #{trade_id}: {e}")
                raise
            finally:
                db.close()

    def _serialize_trade(self, t, open_trade):
        duration_end = datetime.utcnow() if open_trade else t.exit_time
        duration = (duration_end - t.entry_time).total_seconds() if t.entry_time and duration_end else 0.0
        return {
            "id": t.id,
            "trade_id": t.id,
            "symbol": t.symbol,
            "strategy_name": t.strategy_name,
            "type": t.type,
            "side": t.type,
            "entry_price": t.entry_price,
            "exit_price": t.exit_price,
            "current_price": t.current_price,
            "size": t.size,
            "quantity": t.size,
            "leverage": t.leverage or 1.0,
            "margin_used": t.margin_used or 0.0,
            "stop_loss": t.stop_loss,
            "take_profit": t.take_profit,
            "trailing_stop": t.trailing_stop,
            "status": t.status,
            "state": t.state or t.status,
            "pnl": t.pnl or 0.0,
            "unrealized_pnl": t.unrealized_pnl or 0.0,
            "pnl_percentage": t.pnl_percentage or 0.0,
            "roi": t.roi or 0.0,
            "drawdown": t.max_drawdown or 0.0,
            "entry_time": t.entry_time.isoformat() + "Z" if t.entry_time else None,
            "exit_time": t.exit_time.isoformat() + "Z" if t.exit_time else None,
            "duration": duration,
            "trade_type": t.trade_type,
            "exit_reason": t.exit_reason,
            "reason": t.exit_reason,
            "wallet_balance_after": t.wallet_balance_after,
        }


trade_manager = TradeManager()
