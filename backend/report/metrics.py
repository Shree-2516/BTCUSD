import pandas as pd
import numpy as np

class MetricsCalculator:
    """
    Institutional-grade metrics calculator for trading performance.
    """
    @staticmethod
    def calculate_all(trades, equity_curve, initial_capital, risk_free_rate=0.0):
        if not trades:
            return MetricsCalculator._empty_metrics(initial_capital)

        df_trades = pd.DataFrame(trades)
        df_equity = pd.DataFrame(equity_curve)
        
        # Ensure time columns are datetime
        if 'time' in df_equity.columns:
            df_equity['time'] = pd.to_datetime(df_equity['time'])
        
        # 1-3. Profit Metrics
        final_equity = df_equity['equity'].iloc[-1]
        net_profit = final_equity - initial_capital
        
        wins = df_trades[df_trades['pnl'] > 0]
        losses = df_trades[df_trades['pnl'] < 0]
        breakeven = df_trades[df_trades['pnl'] == 0]
        
        gross_profit = wins['pnl'].sum()
        gross_loss = abs(losses['pnl'].sum())
        
        # 4-9. Trade Counts & Rates
        total_trades = len(df_trades)
        winning_trades = len(wins)
        losing_trades = len(losses)
        breakeven_trades = len(breakeven)
        
        win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
        loss_rate = (losing_trades / total_trades) * 100 if total_trades > 0 else 0
        
        # 10-12. Profitability Ratios
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        avg_win = wins['pnl'].mean() if not wins.empty else 0
        avg_loss = abs(losses['pnl'].mean()) if not losses.empty else 0
        risk_reward_ratio = avg_win / avg_loss if avg_loss > 0 else float('inf')
        
        expectancy = ( (winning_trades/total_trades) * avg_win ) - ( (losing_trades/total_trades) * avg_loss ) if total_trades > 0 else 0

        # 13-15. Risk-Adjusted Returns
        equity_returns = df_equity['equity'].pct_change().dropna()
        ann_factor = np.sqrt(252 * 24) # Assuming hourly data, annualize
        
        sharpe = 0
        sortino = 0
        calmar = 0
        
        if len(equity_returns) > 1 and equity_returns.std() != 0:
            sharpe = (equity_returns.mean() - risk_free_rate) / equity_returns.std() * ann_factor
            
            downside_returns = equity_returns[equity_returns < 0]
            if not downside_returns.empty and downside_returns.std() != 0:
                sortino = (equity_returns.mean() - risk_free_rate) / downside_returns.std() * ann_factor
        
        var_95 = 0
        if len(equity_returns) > 0:
            var_95 = np.percentile(equity_returns, 5) * 100
        
        # 16-19. Drawdown Metrics
        df_equity['peak'] = df_equity['equity'].cummax()
        df_equity['dd_amt'] = df_equity['peak'] - df_equity['equity']
        df_equity['dd_pct'] = (df_equity['dd_amt'] / df_equity['peak']) * 100
        
        max_drawdown = df_equity['dd_pct'].max()
        avg_drawdown = df_equity['dd_pct'][df_equity['dd_pct'] > 0].mean() if any(df_equity['dd_pct'] > 0) else 0
        
        recovery_factor = net_profit / (df_equity['dd_amt'].max()) if df_equity['dd_amt'].max() > 0 else float('inf')
        
        total_return_pct = (net_profit / initial_capital) * 100
        
        # CAGR calculation
        if len(df_equity) > 1:
            days = (df_equity['time'].iloc[-1] - df_equity['time'].iloc[0]).days
            if days > 0:
                cagr = ((final_equity / initial_capital) ** (365.0 / days) - 1) * 100
            else:
                cagr = 0
        else:
            cagr = 0

        if max_drawdown > 0:
            calmar = (cagr / max_drawdown) if max_drawdown > 0 else 0

        # 22-24. Performance Statistics
        avg_trade_duration = df_trades['duration'].mean() if 'duration' in df_trades.columns else 0
        largest_win = wins['pnl'].max() if not wins.empty else 0
        largest_loss = losses['pnl'].min() if not losses.empty else 0
        
        # 25-28. Streaks
        pnl_series = df_trades['pnl'].values
        consecutive_wins = 0
        consecutive_losses = 0
        current_win_streak = 0
        current_loss_streak = 0
        
        for pnl in pnl_series:
            if pnl > 0:
                current_win_streak += 1
                current_loss_streak = 0
                consecutive_wins = max(consecutive_wins, current_win_streak)
            elif pnl < 0:
                current_loss_streak += 1
                current_win_streak = 0
                consecutive_losses = max(consecutive_losses, current_loss_streak)
            else:
                current_win_streak = 0
                current_loss_streak = 0
                
        # 29-33. Averages & R-Multiple
        avg_profit_per_trade = net_profit / total_trades if total_trades > 0 else 0
        
        # R-Multiple assumes risk was 1% of balance or similar; if not tracked, we use a proxy
        # For now, we'll set it to 0 or calculate if risk data available
        avg_r_multiple = 0 # Requires risk per trade tracking

        return {
            "net_profit": float(net_profit),
            "gross_profit": float(gross_profit),
            "gross_loss": float(gross_loss),
            "total_trades": int(total_trades),
            "winning_trades": int(winning_trades),
            "losing_trades": int(losing_trades),
            "breakeven_trades": int(breakeven_trades),
            "win_rate": f"{win_rate:.2f}%",
            "loss_rate": f"{loss_rate:.2f}%",
            "profit_factor": f"{profit_factor:.2f}",
            "risk_reward_ratio": f"{risk_reward_ratio:.2f}",
            "expectancy": float(expectancy),
            "sharpe_ratio": f"{sharpe:.2f}",
            "sortino_ratio": f"{sortino:.2f}",
            "calmar_ratio": f"{calmar:.2f}",
            "value_at_risk_95": f"{var_95:.2f}%",
            "max_drawdown": f"{max_drawdown:.2f}%",
            "avg_drawdown": f"{avg_drawdown:.2f}%",
            "recovery_factor": f"{recovery_factor:.2f}",
            "return_pct": f"{total_return_pct:.2f}%",
            "cagr": f"{cagr:.2f}%",
            "avg_trade_duration": f"{avg_trade_duration/3600:.2f} hours",
            "largest_win": float(largest_win),
            "largest_loss": float(largest_loss),
            "consecutive_wins": int(consecutive_wins),
            "consecutive_losses": int(consecutive_losses),
            "avg_profit_per_trade": float(avg_profit_per_trade),
            "avg_win": float(avg_win),
            "avg_loss": float(avg_loss),
            "final_balance": float(final_equity)
        }

    @staticmethod
    def _empty_metrics(initial_capital):
        return {
            "net_profit": 0, "gross_profit": 0, "gross_loss": 0,
            "total_trades": 0, "winning_trades": 0, "losing_trades": 0, "breakeven_trades": 0,
            "win_rate": "0%", "loss_rate": "0%", "profit_factor": "0.00",
            "risk_reward_ratio": "0.00", "expectancy": 0,
            "sharpe_ratio": "0.00", "sortino_ratio": "0.00", "calmar_ratio": "0.00", "value_at_risk_95": "0.00%",
            "max_drawdown": "0%", "avg_drawdown": "0%", "recovery_factor": "0.00",
            "return_pct": "0%", "cagr": "0%", "avg_trade_duration": "0 hours",
            "largest_win": 0, "largest_loss": 0, "consecutive_wins": 0, "consecutive_losses": 0,
            "avg_profit_per_trade": 0, "avg_win": 0, "avg_loss": 0, "final_balance": initial_capital
        }
