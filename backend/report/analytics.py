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
        
        # Long vs short split
        long_pnl, short_pnl, long_count, short_count = 0, 0, 0, 0
        if 'side' in df.columns or 'type' in df.columns:
            side_col = 'side' if 'side' in df.columns else 'type'
            longs = df[df[side_col].isin(['BUY', 'LONG'])]
            shorts = df[df[side_col].isin(['SELL', 'SHORT'])]
            long_pnl = float(longs['pnl'].sum()) if not longs.empty else 0
            short_pnl = float(shorts['pnl'].sum()) if not shorts.empty else 0
            long_count = int(len(longs))
            short_count = int(len(shorts))

        return {
            "monthly_pnl": monthly_data,
            "day_of_week": day_pnl,
            "hour_of_day": hour_pnl,
            "long_short_split": {
                "long_pnl": long_pnl,
                "short_pnl": short_pnl,
                "long_count": long_count,
                "short_count": short_count
            }
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
        
        skewness = float(df['pnl'].skew()) if len(df) > 2 and df['pnl'].std() != 0 else 0
        kurtosis = float(df['pnl'].kurtosis()) if len(df) > 3 and df['pnl'].std() != 0 else 0
        
        return {
            "pnl_distribution": pnl_dist,
            "win_loss_count": {"wins": wins, "losses": losses},
            "skewness": skewness,
            "kurtosis": kurtosis
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
