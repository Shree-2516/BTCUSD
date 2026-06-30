from backend.database.db import SessionLocal, PerformanceMetric, Wallet, Trade, EquityCurvePoint
from backend.utils.logger import logger
from datetime import datetime, timedelta
import numpy as np

class MetricsTracker:
    """
    Calculates and persists live paper trading performance metrics.
    """
    
    def update_metrics(self, current_price: float):
        db = SessionLocal()
        try:
            wallet = db.query(Wallet).first()
            if not wallet:
                return
            active_trades = db.query(Trade).filter(Trade.status == "OPEN").all()
            
            unrealized_pnl = 0
            for trade in active_trades:
                if trade.type == "BUY":
                    unrealized_pnl += (current_price - trade.entry_price) * trade.size
                else:
                    unrealized_pnl += (trade.entry_price - current_price) * trade.size
            
            wallet.unrealized_pnl = unrealized_pnl
            wallet.total_equity = wallet.balance + unrealized_pnl
            total_balance = wallet.total_equity
            
            # Calculate daily return (simplified)
            # In a real system, we'd compare against balance 24h ago
            yesterday = datetime.utcnow() - timedelta(days=1)
            old_metric = db.query(PerformanceMetric).filter(PerformanceMetric.timestamp <= yesterday).order_by(PerformanceMetric.timestamp.desc()).first()
            
            daily_return = 0
            if old_metric:
                daily_return = (total_balance - old_metric.total_balance) / old_metric.total_balance
            
            # Save new metric point
            metric = PerformanceMetric(
                total_balance=total_balance,
                unrealized_pnl=unrealized_pnl,
                daily_return=daily_return,
                open_trades_count=len(active_trades)
            )
            db.add(metric)
            db.add(EquityCurvePoint(
                balance=wallet.balance,
                equity=total_balance,
                available_balance=wallet.available_balance,
                used_margin=wallet.used_margin or 0.0,
                unrealized_pnl=unrealized_pnl,
                realized_pnl=wallet.realized_pnl or 0.0,
            ))
            db.commit()
            
        except Exception as e:
            logger.error(f"Metrics Update Error: {e}")
            db.rollback()
        finally:
            db.close()

    def get_summary(self):
        db = SessionLocal()
        try:
            metrics = db.query(PerformanceMetric).order_by(PerformanceMetric.timestamp.desc()).limit(100).all()
            if not metrics:
                return {}
                
            balances = [m.total_balance for m in metrics]
            returns = [m.daily_return for m in metrics if m.daily_return != 0]
            
            # Sharpe Ratio (Rough approximation)
            sharpe = np.mean(returns) / np.std(returns) * np.sqrt(252) if len(returns) > 5 and np.std(returns) > 0 else 0
            
            # Max Drawdown
            peak = max(balances)
            drawdown = (peak - min(balances)) / peak if peak > 0 else 0
            
            return {
                "current_equity": balances[0],
                "unrealized_pnl": metrics[0].unrealized_pnl,
                "sharpe_ratio": round(sharpe, 2),
                "max_drawdown": f"{round(drawdown * 100, 2)}%",
                "open_trades": metrics[0].open_trades_count
            }
        finally:
            db.close()

metrics_tracker = MetricsTracker()
