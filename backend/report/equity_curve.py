import pandas as pd
import numpy as np

class EquityAnalyzer:
    """
    Analyzes equity curve and drawdown metrics.
    """
    @staticmethod
    def process_curve(equity_curve):
        if not equity_curve:
            return {}

        df = pd.DataFrame(equity_curve)
        if 'time' in df.columns:
            df['time'] = pd.to_datetime(df['time'])
            
        # Cumulative PnL
        initial_equity = df['equity'].iloc[0]
        df['cum_pnl'] = df['equity'] - initial_equity
        
        # Drawdown calculation
        df['peak'] = df['equity'].cummax()
        df['drawdown_amt'] = df['peak'] - df['equity']
        df['drawdown_pct'] = (df['drawdown_amt'] / df['peak']) * 100
        
        # Daily PnL
        df.set_index('time', inplace=True)
        daily_equity = df['equity'].resample('D').last().ffill()
        daily_pnl = daily_equity.diff().fillna(0)
        
        return {
            "equity": df['equity'].tolist(),
            "balance": df['balance'].tolist() if 'balance' in df.columns else [],
            "drawdown_pct": df['drawdown_pct'].tolist(),
            "cum_pnl": df['cum_pnl'].tolist(),
            "times": [t.isoformat() for t in df.index],
            "daily_pnl": {str(k.date()): float(v) for k, v in daily_pnl.items()}
        }
