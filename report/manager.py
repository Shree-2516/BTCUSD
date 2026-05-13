from database.db import SessionLocal, BacktestReport
from datetime import datetime
import json
from sqlalchemy import desc

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

report_manager = ReportManager()
