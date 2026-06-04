from database.db import SessionLocal, BacktestReport, Trade, EquityCurvePoint, Wallet
from datetime import datetime
import json
from sqlalchemy import desc
from report.metrics import MetricsCalculator
from report.analytics import AnalyticsEngine
from report.equity_curve import EquityAnalyzer
from report.charts import ChartGenerator

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

report_manager = ReportManager()
