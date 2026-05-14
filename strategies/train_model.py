import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
import joblib
from utils.delta_api import delta_api
from datetime import datetime, timedelta
import os

def prepare_data(symbol="BTCUSD", days=30):
    print(f"Fetching historical data for {symbol} ({days} days)...")
    end_ts = int(datetime.now().timestamp())
    start_ts = end_ts - (days * 24 * 3600)
    
    df = delta_api.get_historical_data(symbol, "1h", start_ts, end_ts)
    if df.empty:
        print("No data found!")
        return None
    
    # Feature engineering
    df['returns'] = df['close'].pct_change()
    df['target'] = (df['returns'].shift(-1) > 0).astype(int) # 1 if price goes up next hour
    df['volatility'] = df['returns'].rolling(24).std()
    df['target_vol'] = df['volatility'].shift(-4) # Predict volatility 4h ahead
    
    # Add some indicators
    df['ma7'] = df['close'].rolling(7).mean()
    df['ma25'] = df['close'].rolling(25).mean()
    df['diff'] = (df['ma7'] - df['ma25']) / df['ma25']
    
    return df.dropna()

def train():
    df = prepare_data()
    if df is None: return
    
    features = ['close', 'diff', 'volatility']
    X = df[features]
    
    # 1. Train Directional Model
    y_dir = df['target']
    X_train, X_test, y_train, y_test = train_test_split(X, y_dir, test_size=0.2, shuffle=False)
    
    dir_model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1)
    dir_model.fit(X_train, y_train)
    
    # 2. Train Volatility Model
    y_vol = df['target_vol']
    X_train, X_test, y_train, y_test = train_test_split(X, y_vol, test_size=0.2, shuffle=False)
    
    vol_model = xgb.XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.1)
    vol_model.fit(X_train, y_train)
    
    # Save models
    os.makedirs('models', exist_ok=True)
    joblib.dump(dir_model, 'models/direction_model.joblib')
    joblib.dump(vol_model, 'models/volatility_model.joblib')
    print("Models trained and saved to models/ folder.")

if __name__ == "__main__":
    train()
