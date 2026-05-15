import pandas as pd
import numpy as np

class AnalyticsEngine:
    """
    Handles advanced analysis like periodicity, distributions, and exit reasons.
    """
    @staticmethod
    def calculate_periodicity(trades):
        if not trades:
            return {}

        df = pd.DataFrame(trades)
        df['exit_time'] = pd.to_datetime(df['exit_time'])
        
        # Monthly performance
        monthly_pnl = df.set_index('exit_time')['pnl'].resample('ME').sum()
        monthly_data = {str(k.date()): float(v) for k, v in monthly_pnl.items()}
        
        # Day of week performance
        df['day'] = df['exit_time'].dt.day_name()
        day_pnl = df.groupby('day')['pnl'].sum().to_dict()
        
        # Hour of day performance
        df['hour'] = df['exit_time'].dt.hour
        hour_pnl = df.groupby('hour')['pnl'].sum().to_dict()
        
        return {
            "monthly_pnl": monthly_data,
            "day_of_week": day_pnl,
            "hour_of_day": hour_pnl
        }

    @staticmethod
    def calculate_distributions(trades):
        if not trades:
            return {}

        df = pd.DataFrame(trades)
        
        # PnL Distribution (Bins)
        pnl_bins = pd.cut(df['pnl'], bins=20).value_counts().sort_index()
        pnl_dist = {str(k): int(v) for k, v in pnl_bins.items()}
        
        # Win/Loss counts
        wins = int(len(df[df['pnl'] > 0]))
        losses = int(len(df[df['pnl'] <= 0]))
        
        return {
            "pnl_distribution": pnl_dist,
            "win_loss_count": {"wins": wins, "losses": losses}
        }

    @staticmethod
    def analyze_exits(trades):
        if not trades:
            return {}

        df = pd.DataFrame(trades)
        if 'reason' not in df.columns:
            return {}
            
        exit_counts = df['reason'].value_counts().to_dict()
        exit_pnl = df.groupby('reason')['pnl'].sum().to_dict()
        
        return {
            "exit_reason_counts": {str(k): int(v) for k, v in exit_counts.items()},
            "exit_reason_pnl": {str(k): float(v) for k, v in exit_pnl.items()}
        }
