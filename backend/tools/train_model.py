import os
import sys
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import joblib
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split

from backend.utils.delta_api import delta_api


def prepare_data(symbol="BTCUSD", days=30):
    print(f"Fetching historical data for {symbol} ({days} days)...")
    end_ts = int(datetime.now().timestamp())
    start_ts = end_ts - (days * 24 * 3600)

    df = delta_api.get_historical_data(symbol, "1h", start_ts, end_ts)
    if df.empty:
        print("No data found!")
        return None

    df["returns"] = df["close"].pct_change()
    df["target"] = (df["returns"].shift(-1) > 0).astype(int)
    df["volatility"] = df["returns"].rolling(24).std()
    df["target_vol"] = df["volatility"].shift(-4)

    df["ma7"] = df["close"].rolling(7).mean()
    df["ma25"] = df["close"].rolling(25).mean()
    df["diff"] = (df["ma7"] - df["ma25"]) / df["ma25"]

    return df.dropna()


def train():
    df = prepare_data()
    if df is None:
        return

    features = ["close", "diff", "volatility"]
    x = df[features]

    y_dir = df["target"]
    x_train, _, y_train, _ = train_test_split(x, y_dir, test_size=0.2, shuffle=False)

    dir_model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1)
    dir_model.fit(x_train, y_train)

    y_vol = df["target_vol"]
    x_train, _, y_train, _ = train_test_split(x, y_vol, test_size=0.2, shuffle=False)

    vol_model = xgb.XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.1)
    vol_model.fit(x_train, y_train)

    os.makedirs("models", exist_ok=True)
    joblib.dump(dir_model, "models/direction_model.joblib")
    joblib.dump(vol_model, "models/volatility_model.joblib")
    print("Models trained and saved to models/ folder.")


if __name__ == "__main__":
    train()
