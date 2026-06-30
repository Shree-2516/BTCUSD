import pandas as pd
import numpy as np

class Portfolio:
    """
    Manages balance, positions, and trade accounting for the backtester.
    """
    def __init__(self, initial_capital=10000.0, leverage=1.0):
        self.initial_capital = initial_capital
        self.leverage = leverage
        self.balance = initial_capital
        self.positions = {} # {symbol: {'size': size, 'entry_price': price, 'type': 'BUY'/'SELL'}}
        self.equity_curve = []
        self.trade_history = []
        self.current_equity = initial_capital

    def reset(self):
        self.balance = self.initial_capital
        self.positions = {}
        self.equity_curve = []
        self.trade_history = []
        self.current_equity = self.initial_capital

    def update_equity(self, timestamp, current_price):
        """Calculates current equity including unrealized PnL."""
        unrealized_pnl = 0
        for symbol, pos in self.positions.items():
            if pos['type'] == 'BUY':
                unrealized_pnl += (current_price - pos['entry_price']) * pos['size']
            else:
                unrealized_pnl += (pos['entry_price'] - current_price) * pos['size']
        
        self.current_equity = self.balance + unrealized_pnl
        
        # Format timestamp
        time_str = timestamp.isoformat() + "Z" if hasattr(timestamp, 'isoformat') else str(timestamp)
        
        self.equity_curve.append({
            'time': time_str,
            'equity': self.current_equity,
            'balance': self.balance,
            'unrealized_pnl': unrealized_pnl
        })
        return self.current_equity

    def open_position(self, symbol, side, price, size, timestamp, fee=0, stop_loss=None, take_profit=None, leverage=1.0, ai_metadata=None):
        """
        Opens a new position.
        side: 'BUY' or 'SELL'
        """
        if symbol in self.positions:
            return

        self.balance -= fee 
        
        self.positions[symbol] = {
            'type': side,
            'entry_price': price,
            'size': size,
            'entry_time': timestamp,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'leverage': leverage,
            'ai_metadata': ai_metadata
        }

    def close_position(self, symbol, price, timestamp, fee=0, reason="Signal"):
        """
        Closes an existing position and settles PnL.
        """
        if symbol not in self.positions:
            return 0
        
        pos = self.positions.pop(symbol)
        if pos['type'] == 'BUY':
            pnl = (price - pos['entry_price']) * pos['size']
        else:
            pnl = (pos['entry_price'] - price) * pos['size']
            
        self.balance += pnl - fee
        
        entry_time_str = pos['entry_time'].isoformat() + "Z" if hasattr(pos['entry_time'], 'isoformat') else str(pos['entry_time'])
        exit_time_str = timestamp.isoformat() + "Z" if hasattr(timestamp, 'isoformat') else str(timestamp)

        # Calculate additional metrics for this specific trade
        duration = (timestamp - pos['entry_time']).total_seconds() if hasattr(timestamp, 'total_seconds') else 0
        
        trade_record = {
            'symbol': symbol,
            'type': pos['type'],
            'entry_price': pos['entry_price'],
            'exit_price': price,
            'size': pos['size'],
            'pnl': pnl - fee,
            'fee': fee,
            'entry_time': entry_time_str,
            'exit_time': exit_time_str,
            'duration': duration,
            'status': 'CLOSED',
            'reason': reason,
            'stop_loss': pos.get('stop_loss'),
            'take_profit': pos.get('take_profit'),
            'leverage': pos.get('leverage'),
            'ai_metadata': pos.get('ai_metadata')
        }
        self.trade_history.append(trade_record)
        return pnl - fee

    def get_position(self, symbol):
        return self.positions.get(symbol)

    def is_long(self, symbol):
        pos = self.get_position(symbol)
        return pos and pos['type'] == 'BUY'

    def is_short(self, symbol):
        pos = self.get_position(symbol)
        return pos and pos['type'] == 'SELL'
