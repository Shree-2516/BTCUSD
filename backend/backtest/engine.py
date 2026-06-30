import pandas as pd
import numpy as np
from datetime import datetime
import os
import json
import math
import numbers


def _json_finite(obj):
    """Replace NaN/inf so JSON and browsers never see non-finite numbers."""
    if obj is None:
        return None
    if isinstance(obj, dict):
        return {k: _json_finite(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_finite(v) for v in obj]
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, (str, int)):
        return obj
    if isinstance(obj, numbers.Real):
        x = float(obj)
        return x if math.isfinite(x) else None
    try:
        x = float(obj)
        return x if math.isfinite(x) else None
    except (TypeError, ValueError):
        return obj


from backend.backtest.portfolio import Portfolio
from backend.backtest.execution import ExecutionHandler
from backend.backtest.slippage import FixedSlippage

class BacktestEngine:
    """
    Advanced Backtesting Engine with realistic execution, 
    slippage, fees, and SL/TP simulation.
    """
    def __init__(self, initial_capital=10000.0, commission_rate=0.0005, slippage_pct=0.0002):
        self.initial_capital = initial_capital
        
        # Initialize components
        self.portfolio = Portfolio(initial_capital)
        self.execution = ExecutionHandler(
            slippage_model=FixedSlippage(slippage_pct),
            commission_rate=commission_rate
        )
        self.reset()

    def reset(self):
        self.portfolio.reset()
        self.current_strategy = None

    def run(self, strategy, df):
        """
        Main backtest loop.
        Ensures no lookahead bias by executing on the next candle's open.
        """
        self.reset()
        self.current_strategy = strategy
        
        if df.empty:
            return {"error": "No data for backtest"}

        # Sort chronologically
        df = df.sort_index()
        
        # Iteration starts from 1 because we need history[0] to get a signal for history[1]
        for i in range(1, len(df)):
            timestamp = df.index[i]
            current_bar = df.iloc[i]
            prev_bar = df.iloc[i-1]
            history = df.iloc[:i] # History up to (and including) prev_bar
            
            # 1. Update Portfolio equity at candle start
            self.portfolio.update_equity(timestamp, current_bar['open'])

            # 2. Check for intra-candle Stop Loss / Take Profit hits
            # This simulates what happens DURING the candle
            self.check_intra_candle_exits(current_bar, timestamp)

            # 3. Generate signals based on the CLOSED candle (prev_bar)
            signal = strategy.on_bar(prev_bar, history)
            
            # 4. Handle signals (Execution at current candle's open)
            if signal:
                self.process_signal(signal, current_bar, timestamp)

        # Close any open position at the end of the data
        if self.portfolio.positions:
            last_bar = df.iloc[-1]
            last_time = df.index[-1]
            for symbol in list(self.portfolio.positions.keys()):
                self.execute_exit(symbol, last_bar['close'], last_time, "End of Backtest")

        return self.generate_report()

    def check_intra_candle_exits(self, bar, timestamp):
        """Checks if High or Low hit any SL/TP levels."""
        for symbol, pos in list(self.portfolio.positions.items()):
            # Note: In a real institutional system, we would check if Low hit SL before High hit TP
            # but with 1h/1d candles we can only estimate.
            
            # For simplicity, we check SL first (conservative)
            sl = getattr(self.current_strategy, 'stop_loss', None)
            tp = getattr(self.current_strategy, 'take_profit', None)
            
            if pos['type'] == 'BUY':
                if sl and bar['low'] <= sl:
                    self.execute_exit(symbol, sl, timestamp, "Stop Loss (Intra-candle)")
                elif tp and bar['high'] >= tp:
                    self.execute_exit(symbol, tp, timestamp, "Take Profit (Intra-candle)")
            else: # SELL
                if sl and bar['high'] >= sl:
                    self.execute_exit(symbol, sl, timestamp, "Stop Loss (Intra-candle)")
                elif tp and bar['low'] <= tp:
                    self.execute_exit(symbol, tp, timestamp, "Take Profit (Intra-candle)")

    def process_signal(self, signal, bar, timestamp):
        """Processes signals from the strategy and executes trades."""
        symbol = "BTCUSD" # Default symbol for this system
        
        if signal == 'BUY':
            if self.portfolio.is_short(symbol):
                self.execute_exit(symbol, bar['open'], timestamp, "Exit Short (Signal)")
            if not self.portfolio.is_long(symbol):
                self.execute_entry(symbol, 'BUY', bar['open'], timestamp)
                
        elif signal == 'SELL':
            if self.portfolio.is_long(symbol):
                self.execute_exit(symbol, bar['open'], timestamp, "Exit Long (Signal)")
            if not self.portfolio.is_short(symbol):
                self.execute_entry(symbol, 'SELL', bar['open'], timestamp)
                
        elif signal in ['EXIT_BUY', 'EXIT_LONG']:
            self.execute_exit(symbol, bar['open'], timestamp, "Manual Exit (Signal)")
            
        elif signal in ['EXIT_SELL', 'EXIT_SHORT']:
            self.execute_exit(symbol, bar['open'], timestamp, "Manual Exit (Signal)")

    def execute_entry(self, symbol, side, price, timestamp):
        """Simulates entry with slippage and fees."""
        fill_price = self.execution.get_fill_price(price, side)
        
        # Calculate size based on balance (95% risk to avoid margin issues)
        size = (self.portfolio.balance * 0.95) / fill_price
        
        fee = self.execution.calculate_commission(fill_price, size)
        self.portfolio.open_position(symbol, side, fill_price, size, timestamp, fee=fee)

    def execute_exit(self, symbol, price, timestamp, reason):
        """Simulates exit with slippage and fees."""
        pos = self.portfolio.get_position(symbol)
        if not pos:
            return
            
        side = 'SELL' if pos['type'] == 'BUY' else 'BUY'
        fill_price = self.execution.get_fill_price(price, side)
        fee = self.execution.calculate_commission(fill_price, pos['size'])
        
        self.portfolio.close_position(symbol, fill_price, timestamp, fee=fee, reason=reason)

    def generate_report(self):
        """Generates institutional-grade performance report."""
        from report.metrics import MetricsCalculator as AdvancedMetrics
        from report.analytics import AnalyticsEngine
        from report.equity_curve import EquityAnalyzer
        from report.ai_analytics import AIAnalytics
        from report.charts import ChartGenerator

        # 1. Calculate Core Metrics
        metrics = AdvancedMetrics.calculate_all(
            self.portfolio.trade_history,
            self.portfolio.equity_curve,
            self.initial_capital
        )
        
        # 2. Advanced Analytics
        analytics = AnalyticsEngine.calculate_periodicity(self.portfolio.trade_history)
        distributions = AnalyticsEngine.calculate_distributions(self.portfolio.trade_history)
        exits = AnalyticsEngine.analyze_exits(self.portfolio.trade_history)
        
        # 3. Equity & Drawdown Analysis
        equity_analysis = EquityAnalyzer.process_curve(self.portfolio.equity_curve)
        
        # 4. AI Analytics
        ai_stats = AIAnalytics.analyze_predictions(self.portfolio.trade_history)
        
        # 5. Chart Data
        charts = ChartGenerator.generate_all(equity_analysis, {**analytics, **distributions}, ai_stats)

        # Legacy performance structure for database compatibility
        performance = {
            "initial_capital": self.initial_capital,
            "final_capital": metrics["final_balance"],
            "net_pnl": metrics["net_profit"],
            "win_rate": float(metrics["win_rate"].replace('%', '')),
            "total_trades": metrics["total_trades"],
            "max_drawdown": float(metrics["max_drawdown"].replace('%', ''))
        }
        
        parameters = {
            "strategy": self.current_strategy.name if self.current_strategy else "Unknown",
            "initial_capital": self.initial_capital,
            "resolution": getattr(self.current_strategy, "timeframe", None),
        }

        report = {
            "strategy": parameters["strategy"],
            "metrics": metrics,
            "analytics": analytics,
            "distributions": distributions,
            "exits": exits,
            "equity_analysis": equity_analysis,
            "ai_stats": ai_stats,
            "charts": charts,
            "trades": self.portfolio.trade_history,
            "equity_curve": self.portfolio.equity_curve,
            "performance": performance,
            "parameters": parameters
        }

        report = _json_finite(report)

        # Save report to file (Incremental/Safe)
        os.makedirs("report/backtest_reports", exist_ok=True)
        filename = f"report/backtest_reports/{report['strategy']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=4)
            
        return report
