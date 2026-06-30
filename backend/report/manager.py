from backend.database.db import SessionLocal, BacktestReport, Trade, EquityCurvePoint, Wallet
from datetime import datetime
import json
from sqlalchemy import desc, func
from backend.report.metrics import MetricsCalculator
from backend.report.analytics import AnalyticsEngine
from backend.report.equity_curve import EquityAnalyzer
from backend.report.charts import ChartGenerator

class ReportManager:
    def get_session(self):
        return SessionLocal()

    def save_report(self, report_data):
        db = self.get_session()
        try:
            # Extract basic info from report
            stats = report_data.get("performance", {})
            params = report_data.get("parameters", {})
            
            # Convert dates if they are strings
            start_date = params.get("start_date")
            end_date = params.get("end_date")
            
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d")

            report = BacktestReport(
                strategy_name=params.get("strategy", "Unknown"),
                initial_capital=stats.get("initial_capital", 0),
                final_capital=stats.get("final_capital", 0),
                net_pnl=stats.get("net_pnl", 0),
                win_rate=stats.get("win_rate", 0),
                total_trades=stats.get("total_trades", 0),
                max_drawdown=stats.get("max_drawdown", 0),
                start_date=start_date,
                end_date=end_date,
                report_data=json.dumps(report_data)
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            return report.id
        finally:
            db.close()

    def get_reports(self, limit=20):
        db = self.get_session()
        try:
            reports = db.query(BacktestReport).order_by(desc(BacktestReport.created_at)).limit(limit).all()
            return [
                {
                    "id": r.id,
                    "strategy_name": r.strategy_name,
                    "net_pnl": r.net_pnl,
                    "win_rate": r.win_rate,
                    "total_trades": r.total_trades,
                    "max_drawdown": r.max_drawdown,
                    "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
                }
                for r in reports
            ]
        finally:
            db.close()

    def get_report_details(self, report_id):
        db = self.get_session()
        try:
            report = db.query(BacktestReport).filter(BacktestReport.id == report_id).first()
            if report:
                return json.loads(report.report_data)
            return None
        finally:
            db.close()

    def delete_report(self, report_id):
        db = self.get_session()
        try:
            report = db.query(BacktestReport).filter(BacktestReport.id == report_id).first()
            if not report:
                return False
            db.delete(report)
            db.commit()
            return True
        finally:
            db.close()

    def export_report(self, report_id, format='csv'):
        from report.exports import ExportManager
        report_data = self.get_report_details(report_id)
        if not report_data:
            return None
            
        if format == 'csv':
            return ExportManager.to_csv(report_data.get('trades', []))
        elif format == 'excel':
            return ExportManager.to_excel(report_data)
        return None

    def get_live_report(self, limit=500):
        db = self.get_session()
        try:
            trades = db.query(Trade).filter(Trade.status == "CLOSED").order_by(Trade.exit_time.asc()).limit(limit).all()
            trade_rows = []
            for t in trades:
                duration = (t.exit_time - t.entry_time).total_seconds() if t.exit_time and t.entry_time else 0
                trade_rows.append({
                    "id": t.id,
                    "type": t.type,
                    "side": t.type,
                    "strategy": t.strategy_name,
                    "strategy_name": t.strategy_name,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "size": t.size,
                    "quantity": t.size,
                    "leverage": t.leverage or 1.0,
                    "margin_used": t.margin_used or 0.0,
                    "pnl": t.pnl or 0.0,
                    "pnl_percentage": t.pnl_percentage or 0.0,
                    "entry_time": t.entry_time.isoformat() if t.entry_time else None,
                    "exit_time": t.exit_time.isoformat() if t.exit_time else None,
                    "duration": duration,
                    "reason": t.exit_reason or "Signal",
                    "exit_reason": t.exit_reason or "Signal",
                    "stop_loss": t.stop_loss,
                    "take_profit": t.take_profit,
                    "fees": t.fees or 0.0,
                    "wallet_balance_after": t.wallet_balance_after,
                })

            wallet = db.query(Wallet).first()
            initial = wallet.starting_balance if wallet and wallet.starting_balance else 10000.0
            points = db.query(EquityCurvePoint).order_by(EquityCurvePoint.timestamp.asc()).limit(limit).all()
            equity_curve = [
                {
                    "time": p.timestamp.isoformat(),
                    "balance": p.balance,
                    "equity": p.equity,
                    "available_balance": p.available_balance,
                    "used_margin": p.used_margin,
                    "unrealized_pnl": p.unrealized_pnl,
                }
                for p in points
            ]
            if not equity_curve and wallet:
                equity_curve = [{
                    "time": datetime.utcnow().isoformat(),
                    "balance": wallet.balance,
                    "equity": wallet.total_equity or wallet.balance,
                }]

            metrics = MetricsCalculator.calculate_all(trade_rows, equity_curve, initial)
            equity_data = EquityAnalyzer.process_curve(equity_curve)
            distributions = AnalyticsEngine.calculate_distributions(trade_rows)
            periodicity = AnalyticsEngine.calculate_periodicity(trade_rows)
            exits = AnalyticsEngine.analyze_exits(trade_rows)
            analytics_data = {**distributions, **periodicity}
            return {
                "parameters": {
                    "strategy": "Live Paper Trading",
                    "resolution": "live",
                    "start_date": trade_rows[0]["entry_time"][:10] if trade_rows and trade_rows[0]["entry_time"] else None,
                    "end_date": datetime.utcnow().date().isoformat(),
                },
                "performance": {
                    "net_pnl": metrics.get("net_profit", 0),
                    "win_rate": metrics.get("win_rate", "0%"),
                    "total_trades": metrics.get("total_trades", 0),
                    "max_drawdown": metrics.get("max_drawdown", "0%"),
                },
                "metrics": metrics,
                "trades": trade_rows,
                "equity_curve": equity_curve,
                "analytics": analytics_data,
                "exits": exits,
                "charts": ChartGenerator.generate_all(equity_data, analytics_data, {}),
            }
        finally:
            db.close()

    def get_live_summaries(self):
        db = self.get_session()
        try:
            trades = db.query(
                Trade.strategy_name,
                func.count(Trade.id).label('total_trades'),
                func.sum(Trade.pnl).label('total_pnl'),
                func.sum(Trade.margin_used).label('open_exposure')
            ).filter(Trade.status == "CLOSED").group_by(Trade.strategy_name).all()

            results = []
            for t in trades:
                # Calculate wins explicitly if needed, or approximate via pnl if we can't query inside group by easily
                # Instead, do a secondary query or subquery for win counts. To keep it simple:
                strategy_trades = db.query(Trade).filter(Trade.strategy_name == t.strategy_name, Trade.status == "CLOSED").all()
                wins = len([x for x in strategy_trades if (x.pnl or 0) > 0])
                win_rate = (wins / len(strategy_trades) * 100) if strategy_trades else 0

                results.append({
                    "strategy_name": t.strategy_name or "Manual",
                    "total_trades": t.total_trades,
                    "total_pnl": t.total_pnl or 0.0,
                    "open_exposure": t.open_exposure or 0.0,
                    "win_rate": f"{win_rate:.2f}%",
                    "last_active": (strategy_trades[-1].exit_time.strftime("%Y-%m-%d %H:%M:%S") if strategy_trades and strategy_trades[-1].exit_time else "N/A")
                })
            return results
        finally:
            db.close()

    def get_portfolio_summary(self):
        db = self.get_session()
        try:
            # Aggregate backtest reports
            reports = db.query(BacktestReport).all()
            total_backtest_pnl = sum([r.net_pnl for r in reports])
            
            # Aggregate live trades
            trades = db.query(Trade).filter(Trade.status == "CLOSED").all()
            total_live_pnl = sum([t.pnl or 0.0 for t in trades])
            live_wins = len([t for t in trades if (t.pnl or 0) > 0])
            live_win_rate = (live_wins / len(trades) * 100) if trades else 0

            return {
                "total_strategies_tested": len(reports),
                "total_backtest_pnl": total_backtest_pnl,
                "total_live_trades": len(trades),
                "total_live_pnl": total_live_pnl,
                "global_live_win_rate": f"{live_win_rate:.2f}%"
            }
        finally:
            db.close()

report_manager = ReportManager()
