import pandas as pd
import numpy as np
from typing import List, Dict

class FeaturePipeline:
    """
    Robust feature engineering pipeline for crypto trading.
    Ensures no lookahead bias and consistent multi-timeframe processing.
    """
    
    @staticmethod
    def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """Adds TA indicators to a dataframe."""
        df = df.copy()
        
        # Returns and Volatility
        df['returns'] = df['close'].pct_change()
        df['volatility_24h'] = df['returns'].rolling(24).std()
        
        # Moving Averages
        df['ma7'] = df['close'].rolling(7).mean()
        df['ma25'] = df['close'].rolling(25).mean()
        df['ma99'] = df['close'].rolling(99).mean()
        
        # Relative Strength Index (RSI)
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = df['close'].ewm(span=12, adjust=False).mean()
        exp2 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd'] = exp1 - exp2
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
        
        # Bollinger Bands
        df['bb_mid'] = df['close'].rolling(window=20).mean()
        df['bb_std'] = df['close'].rolling(window=20).std()
        df['bb_upper'] = df['bb_mid'] + (df['bb_std'] * 2)
        df['bb_lower'] = df['bb_mid'] - (df['bb_std'] * 2)
        
        # Average True Range (ATR)
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = np.max(ranges, axis=1)
        df['atr'] = true_range.rolling(14).mean()
        
        return df

    def get_features_for_prediction(self, multi_tf_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Combines data from multiple timeframes into a single feature vector.
        """
        combined_features = {}
        
        for tf, df in multi_tf_data.items():
            if df.empty: continue
            
            processed_df = self.add_indicators(df)
            last_row = processed_df.iloc[-1]
            
            # Prefix columns with timeframe
            combined_features[f'{tf}_close'] = last_row['close']
            combined_features[f'{tf}_rsi'] = last_row['rsi']
            combined_features[f'{tf}_macd'] = last_row['macd']
            combined_features[f'{tf}_vol'] = last_row['volatility_24h']
            combined_features[f'{tf}_dist_ma25'] = (last_row['close'] - last_row['ma25']) / last_row['ma25']
            
        return pd.DataFrame([combined_features])

feature_pipeline = FeaturePipeline()
