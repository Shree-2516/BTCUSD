from database.db import SessionLocal, Trade, Wallet, Transaction
from datetime import datetime
from wallet.manager import wallet_manager
import sqlalchemy as sa

class TradeManager:
    def __init__(self):
        pass

    def get_session(self):
        return SessionLocal()

    def open_trade(self, symbol, side, price, size, stop_loss=None, take_profit=None, trade_type="MANUAL"):
        db = self.get_session()
        try:
            # Calculate cost
            cost = price * size
            
            # Check wallet available balance
            wallet = wallet_manager.get_status()
            if wallet['available_balance'] < cost:
                raise ValueError(f"Insufficient available funds. Required: {cost} {wallet['currency']}")

            # Deduct from available balance (reserve funds)
            wallet_manager.withdraw_funds(cost, f"Reserve for {trade_type} {side} {size} {symbol}")

            # Create trade record
            trade = Trade(
                symbol=symbol,
                type=side,
                entry_price=price,
                size=size,
                stop_loss=stop_loss,
                take_profit=take_profit,
                status="OPEN",
                trade_type=trade_type,
                entry_time=datetime.utcnow()
            )
            db.add(trade)
            db.commit()
            db.refresh(trade)
            return trade.id
        finally:
            db.close()

    def close_trade(self, trade_id, exit_price, reason="Manual"):
        db = self.get_session()
        try:
            trade = db.query(Trade).filter(Trade.id == trade_id, Trade.status == "OPEN").first()
            if not trade:
                raise ValueError("Trade not found or already closed")

            trade.status = "CLOSED"
            trade.exit_price = exit_price
            trade.exit_time = datetime.utcnow()
            
            # Calculate PnL and return amount
            # Return initial cost + PnL
            # For BUY: PnL = (exit - entry) * size. Return = entry * size + PnL = exit * size
            # For SELL: PnL = (entry - exit) * size. Return = entry * size + PnL = (2*entry - exit) * size
            # Wait, for SHORT selling, it's slightly different. 
            # If I sell 0.1 BTC at 80k, I get 8k. 
            # If I buy back at 79k, I pay 7.9k. Profit is 100.
            # So return amount is (entry_price + (entry_price - exit_price)) * size ?
            # PnL for Sell = (entry_price - exit_price) * size
            # Total return = initial_cost + pnl = (price * size) + (price - exit_price) * size = (2*price - exit_price) * size
            
            if trade.type == "BUY":
                pnl = (exit_price - trade.entry_price) * trade.size
            else: # SELL
                pnl = (trade.entry_price - exit_price) * trade.size

            trade.pnl = pnl
            trade.exit_price = exit_price
            trade.exit_time = datetime.utcnow()
            db.commit()

            # Settlement
            cost = trade.entry_price * trade.size
            wallet_manager.settle_trade(cost, pnl, f"Settle {trade.trade_type} {trade.type} {trade.size} {trade.symbol} ({reason})")
            
            return pnl
        finally:
            db.close()

    def get_active_trades(self):
        db = self.get_session()
        try:
            trades = db.query(Trade).filter(Trade.status == "OPEN").all()
            return [
                {
                    "id": t.id,
                    "symbol": t.symbol,
                    "type": t.type,
                    "entry_price": t.entry_price,
                    "size": t.size,
                    "stop_loss": t.stop_loss,
                    "take_profit": t.take_profit,
                    "entry_time": t.entry_time.isoformat() + "Z",
                    "trade_type": t.trade_type
                }
                for t in trades
            ]
        finally:
            db.close()

    def get_trade_history(self, limit=50):
        db = self.get_session()
        try:
            trades = db.query(Trade).filter(Trade.status == "CLOSED").order_by(sa.desc(Trade.exit_time)).limit(limit).all()
            return [
                {
                    "id": t.id,
                    "symbol": t.symbol,
                    "type": t.type,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "size": t.size,
                    "pnl": t.pnl,
                    "entry_time": t.entry_time.isoformat() + "Z",
                    "exit_time": t.exit_time.isoformat() + "Z",
                    "trade_type": t.trade_type
                }
                for t in trades
            ]
        finally:
            db.close()

trade_manager = TradeManager()
