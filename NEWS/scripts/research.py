import os
import sys
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score
from sklearn.preprocessing import StandardScaler

# Ensure project root in PATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

def main():
    print("Initializing Advanced BTC Price & News Sentiment Prediction Model...")
    
    script_dir = os.path.dirname(__file__)
    prices_csv = os.path.join(script_dir, 'btc_historical_prices.csv')
    sentiment_csv = os.path.join(script_dir, 'btc_historical_sentiment.csv')
    
    # 1. Load Price and Sentiment Datasets
    if not os.path.exists(prices_csv):
        print(f"Generating price random walk at: {prices_csv}")
        dates = pd.date_range(start='2026-01-01', periods=100, freq='h')
        prices = [65000.0]
        for _ in range(99):
            prices.append(prices[-1] + np.random.choice([-100.0, 100.0]))
        df_prices = pd.DataFrame({
            'timestamp': dates,
            'close': prices
        })
        df_prices.to_csv(prices_csv, index=False)
    else:
        df_prices = pd.read_csv(prices_csv, parse_dates=['timestamp'])
        
    if not os.path.exists(sentiment_csv):
        print(f"Generating sentiment random walk at: {sentiment_csv}")
        dates = pd.date_range(start='2026-01-01', periods=100, freq='h')
        df_sentiment = pd.DataFrame({
            'timestamp': dates,
            'signal_encoded': np.random.choice([0, 1, 2], 100),
            'confidence': np.random.randint(40, 95, 100)
        })
        df_sentiment.to_csv(sentiment_csv, index=False)
    else:
        df_sentiment = pd.read_csv(sentiment_csv, parse_dates=['timestamp'])
        
    # Merge datasets on timestamps
    df_merged = pd.merge_asof(
        df_prices.sort_values('timestamp'),
        df_sentiment.sort_values('timestamp'),
        on='timestamp',
        direction='backward'
    )
    
    # 2. Feature Engineering
    df_merged['target'] = (df_merged['close'].shift(-1) > df_merged['close']).astype(int)
    df_merged.dropna(inplace=True)
    
    # Safety check: if target has only one class, force rebuild
    if len(df_merged['target'].unique()) < 2:
        print("Warning: Only one class found in target. Force regenerating dataset...")
        dates = pd.date_range(start='2026-01-01', periods=100, freq='h')
        prices = [65000.0]
        for _ in range(99):
            prices.append(prices[-1] + np.random.choice([-100.0, 100.0]))
        df_prices = pd.DataFrame({
            'timestamp': dates,
            'close': prices
        })
        df_prices.to_csv(prices_csv, index=False)
        
        df_sentiment = pd.DataFrame({
            'timestamp': dates,
            'signal_encoded': np.random.choice([0, 1, 2], 100),
            'confidence': np.random.randint(40, 95, 100)
        })
        df_sentiment.to_csv(sentiment_csv, index=False)
        
        df_merged = pd.merge_asof(
            df_prices.sort_values('timestamp'),
            df_sentiment.sort_values('timestamp'),
            on='timestamp',
            direction='backward'
        )
        df_merged['target'] = (df_merged['close'].shift(-1) > df_merged['close']).astype(int)
        df_merged.dropna(inplace=True)
        
    # Lag features
    for lag in [1, 2, 3, 5]:
        df_merged[f'close_pct_change_lag_{lag}'] = df_merged['close'].pct_change(lag)
        df_merged[f'sentiment_signal_lag_{lag}'] = df_merged['signal_encoded'].shift(lag)
        df_merged[f'confidence_lag_{lag}'] = df_merged['confidence'].shift(lag)
        
    df_merged.dropna(inplace=True)
    print(f"Dataset compiled. Shape: {df_merged.shape}")
    print(df_merged.head())
    
    # 3. Train-Test Split (Time-Series Split)
    split_idx = int(len(df_merged) * 0.8)
    train_df = df_merged.iloc[:split_idx]
    test_df = df_merged.iloc[split_idx:]
    
    feature_cols = [
        'close_pct_change_lag_1', 'close_pct_change_lag_2', 'close_pct_change_lag_3',
        'sentiment_signal_lag_1', 'sentiment_signal_lag_2', 'sentiment_signal_lag_3',
        'confidence_lag_1', 'confidence_lag_2', 'confidence_lag_3'
    ]
    
    X_train, y_train = train_df[feature_cols], train_df['target']
    X_test, y_test = test_df[feature_cols], test_df['target']
    
    # 4. Train XGBoost Classifier
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    print(f"Test Accuracy: {accuracy_score(y_test, preds):.4f}")
    
    # 5. Model Evaluation
    print("\n=== Classification Report ===")
    print(classification_report(y_test, preds))
    
    probs = model.predict_proba(X_test)[:, 1]
    print(f"ROC AUC Score: {roc_auc_score(y_test, probs):.4f}")

if __name__ == '__main__':
    main()
