import pandas as pd
import numpy as np

class MetricsCalculator:
    """
    Calculates various trading performance metrics from trade history and equity curve.
    """
    @staticmethod
    def calculate_all(trades, equity_curve, initial_capital, risk_free_rate=0.0):
        if not trades:
            return {
                "net_profit": 0,
                "win_rate": "0%",
                "total_trades": 0,
                "max_drawdown": "0%",
                "sharpe_ratio": 0
            }

        df_trades = pd.DataFrame(trades)
        df_equity = pd.DataFrame(equity_curve)
        
        # Basic Profit metrics
        final_equity = df_equity['equity'].iloc[-1]
        net_profit = final_equity - initial_capital
        total_return_pct = (net_profit / initial_capital) * 100
        
        # Trade statistics
        wins = df_trades[df_trades['pnl'] > 0]
        losses = df_trades[df_trades['pnl'] <= 0]
        win_rate = len(wins) / len(df_trades) if len(df_trades) > 0 else 0
        
        avg_win = wins['pnl'].mean() if not wins.empty else 0
        avg_loss = losses['pnl'].mean() if not losses.empty else 0
        
        gross_profit = wins['pnl'].sum()
        gross_loss = abs(losses['pnl'].sum())
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Expectancy: (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
        loss_rate = 1 - win_rate
        expectancy = (win_rate * avg_win) + (loss_rate * avg_loss) # avg_loss is negative

        # Drawdown calculation
        df_equity['peak'] = df_equity['equity'].cummax()
        df_equity['dd_amt'] = df_equity['peak'] - df_equity['equity']
        df_equity['dd_pct'] = (df_equity['dd_amt'] / df_equity['peak']) * 100
        max_drawdown_pct = df_equity['dd_pct'].max()
        
        # Risk-adjusted metrics (Sharpe/Sortino)
        # Calculate returns based on equity curve steps
        equity_returns = df_equity['equity'].pct_change().dropna()
        
        if len(equity_returns) > 1 and equity_returns.std() != 0:
            # Annualization factor (rough estimate, assuming 1h bars)
            # 24 * 365 = 8760
            ann_factor = np.sqrt(8760) 
            sharpe = (equity_returns.mean() - risk_free_rate) / equity_returns.std() * ann_factor
            
            # Sortino (downside deviation)
            downside_returns = equity_returns[equity_returns < 0]
            if not downside_returns.empty and downside_returns.std() != 0:
                sortino = (equity_returns.mean() - risk_free_rate) / downside_returns.std() * ann_factor
            else:
                sortino = 0
        else:
            sharpe = 0
            sortino = 0

        return {
            "net_profit": float(net_profit),
            "total_return": f"{total_return_pct:.2f}%",
            "win_rate": f"{win_rate * 100:.2f}%",
            "total_trades": len(df_trades),
            "max_drawdown": f"{max_drawdown_pct:.2f}%",
            "profit_factor": f"{profit_factor:.2f}",
            "sharpe_ratio": f"{sharpe:.2f}",
            "sortino_ratio": f"{sortino:.2f}",
            "expectancy": float(expectancy),
            "avg_win": float(avg_win),
            "avg_loss": float(avg_loss),
            "final_balance": float(final_equity)
        }
