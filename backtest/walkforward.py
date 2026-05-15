import pandas as pd
from datetime import timedelta

class WalkForwardValidation:
    """
    Implements Walk-Forward Analysis (WFA) to validate strategy robustness.
    """
    def __init__(self, engine, strategy_class, df):
        self.engine = engine
        self.strategy_class = strategy_class
        self.df = df.sort_index()

    def run(self, train_size_days, test_size_days):
        """
        Runs multiple backtests in a rolling window.
        """
        results = []
        
        # Calculate window sizes in rows (approximate based on average frequency)
        # Better: use time-based slicing
        start_time = self.df.index[0]
        end_time = self.df.index[-1]
        
        current_train_start = start_time
        while True:
            current_train_end = current_train_start + timedelta(days=train_size_days)
            current_test_end = current_train_end + timedelta(days=test_size_days)
            
            if current_test_end > end_time:
                break
                
            # Slice data
            train_data = self.df.loc[current_train_start:current_train_end]
            test_data = self.df.loc[current_train_end:current_test_end]
            
            # In a real system, you would 'train' here if the strategy is ML-based
            # strategy.train(train_data)
            
            # Run backtest on test_data
            strategy = self.strategy_class()
            report = self.engine.run(strategy, test_data)
            
            results.append({
                "period": f"{current_train_end.date()} to {current_test_end.date()}",
                "net_pnl": report.get("net_pnl", 0),
                "win_rate": report.get("win_rate", "0%"),
                "total_trades": report.get("total_trades", 0)
            })
            
            # Shift window
            current_train_start += timedelta(days=test_size_days)
            
        return results
