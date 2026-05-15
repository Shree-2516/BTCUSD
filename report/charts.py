import math


class ChartGenerator:
    """
    Generates structured JSON data for Chart.js or Lightweight Charts.
    """
    @staticmethod
    def _finite_float(v):
        try:
            x = float(v)
            return x if math.isfinite(x) else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_int_count(v):
        try:
            x = int(float(v))
            return x if x >= 0 else 0
        except (TypeError, ValueError):
            return 0

    @staticmethod
    def _trim_series(labels, values):
        """Chart.js requires each dataset length to match labels; drop trailing mismatch."""
        labels = list(labels or [])
        values = list(values or [])
        n = min(len(labels), len(values))
        return labels[:n], [ChartGenerator._finite_float(v) for v in values[:n]]

    @staticmethod
    def generate_all(equity_data, analytics_data, ai_data):
        times = equity_data.get("times") or []
        equity = equity_data.get("equity") or []
        balance = equity_data.get("balance") or []
        dd_pct = equity_data.get("drawdown_pct") or []

        eq_labels, eq_data = ChartGenerator._trim_series(times, equity)
        _, dd_data = ChartGenerator._trim_series(times, dd_pct)

        equity_datasets = [
            {
                "label": "Equity",
                "data": eq_data,
                "borderColor": "#00ff88",
                "fill": False,
            }
        ]
        # Only include Balance when it aligns point-for-point (avoids Chart.js runtime errors).
        if balance and len(balance) == len(times) and len(balance) == len(equity):
            _, bal_data = ChartGenerator._trim_series(times, balance)
            equity_datasets.append(
                {
                    "label": "Balance",
                    "data": bal_data,
                    "borderColor": "#3b82f6",
                    "fill": False,
                }
            )

        return {
            "equity_curve": {
                "labels": eq_labels,
                "datasets": equity_datasets,
            },
            "drawdown": {
                "labels": eq_labels,
                "datasets": [
                    {
                        "label": "Drawdown %",
                        "data": dd_data,
                        "backgroundColor": "rgba(255, 99, 132, 0.2)",
                        "borderColor": "rgba(255, 99, 132, 1)",
                        "fill": True,
                    }
                ],
            },
            "pnl_dist": {
                "labels": list(analytics_data.get("pnl_distribution", {}).keys()),
                "datasets": [
                    {
                        "label": "Frequency",
                        "data": [
                            ChartGenerator._safe_int_count(v)
                            for v in analytics_data.get("pnl_distribution", {}).values()
                        ],
                        "backgroundColor": "#3b82f6",
                    }
                ],
            },
            "monthly_pnl": {
                "labels": list(analytics_data.get("monthly_pnl", {}).keys()),
                "datasets": [
                    {
                        "label": "Net PnL",
                        "data": [
                            ChartGenerator._finite_float(v) or 0
                            for v in analytics_data.get("monthly_pnl", {}).values()
                        ],
                        "backgroundColor": [
                            "#00ff88" if (ChartGenerator._finite_float(v) or 0) > 0 else "#ef4444"
                            for v in analytics_data.get("monthly_pnl", {}).values()
                        ],
                    }
                ],
            },
        }
