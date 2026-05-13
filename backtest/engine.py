import pandas as pd
import numpy as np
from datetime import datetime
import os
import json

class BacktestEngine:
    def __init__(self, initial_capital=10000.0):
        self.initial_capital = initial_capital
        self.reset()

    def reset(self):
        self.balance = self.initial_capital
        self.position = 0  # 1 for Long, -1 for Short, 0 for Flat
        self.entry_price = 0
        self.trades = []
        self.equity_curve = []

    def run(self, strategy, df):
        self.reset()
        if df.empty:
            return {"error": "No data for backtest"}

        # Ensure data is sorted chronologically
        df = df.sort_index()

        for i in range(1, len(df)):
            current_bar = df.iloc[i]
            history = df.iloc[:i]
            
            signal = strategy.on_bar(current_bar, history)
            
            price = current_bar['close']
            timestamp = df.index[i]

            if signal == 'BUY' and self.position <= 0:
                # Exit short if exists
                if self.position == -1:
                    self.close_trade(price, timestamp, "Exit Short")
                
                # Enter Long
                self.position = 1
                self.entry_price = price
                self.trades.append({
                    "entry_time": timestamp.isoformat() + "Z",
                    "entry_price": price,
                    "type": "BUY",
                    "status": "OPEN"
                })

            elif signal == 'SELL' and self.position >= 0:
                # Exit long if exists
                if self.position == 1:
                    self.close_trade(price, timestamp, "Exit Long")
                
                # Enter Short
                self.position = -1
                self.entry_price = price
                self.trades.append({
                    "entry_time": timestamp.isoformat() + "Z",
                    "entry_price": price,
                    "type": "SELL",
                    "status": "OPEN"
                })

            # Track equity
            current_equity = self.balance
            if self.position == 1:
                current_equity += (price - self.entry_price) # Simple linear PnL
            elif self.position == -1:
                current_equity += (self.entry_price - price)
            
            self.equity_curve.append({
                "time": timestamp.isoformat() + "Z",
                "equity": current_equity
            })

        # Close any open position at the end
        if self.position != 0:
            self.close_trade(df.iloc[-1]['close'], df.index[-1], "End of Backtest")

        return self.generate_report(strategy.name)

    def close_trade(self, exit_price, exit_time, reason):
        trade = self.trades[-1]
        trade["exit_time"] = exit_time.isoformat() + "Z"
        trade["exit_price"] = exit_price
        trade["status"] = "CLOSED"
        trade["reason"] = reason
        
        if trade["type"] == "BUY":
            pnl = exit_price - trade["entry_price"]
        else:
            pnl = trade["entry_price"] - exit_price
            
        trade["pnl"] = pnl
        self.balance += pnl

    def generate_report(self, strategy_name):
        if not self.trades:
            return {"error": "No trades executed"}

        df_trades = pd.DataFrame([t for t in self.trades if t['status'] == 'CLOSED'])
        if df_trades.empty:
            return {"error": "No closed trades"}

        net_pnl = df_trades['pnl'].sum()
        win_rate = (df_trades['pnl'] > 0).mean() * 100
        max_drawdown = self.calculate_max_drawdown()
        
        report = {
            "strategy": strategy_name,
            "initial_capital": self.initial_capital,
            "final_balance": self.balance,
            "net_pnl": net_pnl,
            "win_rate": f"{win_rate:.2f}%",
            "total_trades": len(df_trades),
            "max_drawdown": f"{max_drawdown:.2f}%",
            "trades": self.trades,
            "equity_curve": self.equity_curve
        }

        # Save report
        filename = f"report/backtest_reports/{strategy_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=4)
            
        return report

    def calculate_max_drawdown(self):
        equities = [e['equity'] for e in self.equity_curve]
        if not equities: return 0
        peak = equities[0]
        max_dd = 0
        for e in equities:
            if e > peak:
                peak = e
            dd = (peak - e) / peak * 100
            if dd > max_dd:
                max_dd = dd
        return max_dd
