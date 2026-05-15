class ChartGenerator:
    """
    Generates structured JSON data for Chart.js or Lightweight Charts.
    """
    @staticmethod
    def generate_all(equity_data, analytics_data, ai_data):
        return {
            "equity_curve": {
                "labels": equity_data.get("times", []),
                "datasets": [
                    {
                        "label": "Equity",
                        "data": equity_data.get("equity", []),
                        "borderColor": "#00ff88",
                        "fill": False
                    },
                    {
                        "label": "Balance",
                        "data": equity_data.get("balance", []),
                        "borderColor": "#3b82f6",
                        "fill": False
                    }
                ]
            },
            "drawdown": {
                "labels": equity_data.get("times", []),
                "datasets": [
                    {
                        "label": "Drawdown %",
                        "data": equity_data.get("drawdown_pct", []),
                        "backgroundColor": "rgba(255, 99, 132, 0.2)",
                        "borderColor": "rgba(255, 99, 132, 1)",
                        "fill": True
                    }
                ]
            },
            "pnl_dist": {
                "labels": list(analytics_data.get("pnl_distribution", {}).keys()),
                "datasets": [
                    {
                        "label": "Frequency",
                        "data": list(analytics_data.get("pnl_distribution", {}).values()),
                        "backgroundColor": "#3b82f6"
                    }
                ]
            },
            "monthly_pnl": {
                "labels": list(analytics_data.get("monthly_pnl", {}).keys()),
                "datasets": [
                    {
                        "label": "Net PnL",
                        "data": list(analytics_data.get("monthly_pnl", {}).values()),
                        "backgroundColor": ["#00ff88" if v > 0 else "#ef4444" for v in analytics_data.get("monthly_pnl", {}).values()]
                    }
                ]
            }
        }
