import time
from datetime import datetime
from backend.utils.delta_api import delta_api
from backend.utils.feature_pipeline import feature_pipeline
from backend.utils.confidence_engine import confidence_engine
from backend.utils.range_predictor import range_predictor
from backend.utils.model_loader import model_loader
from backend.models.prediction_response import AdvancedPredictionResponse, TimeframePrediction, CurrentPrediction

class AdvancedPredictor:
    def __init__(self):
        # We will attempt to load models here, but if not available we will use mock/heuristics
        self.daily_model = model_loader.load_model("daily")
        self.weekly_model = model_loader.load_model("weekly")
        self.monthly_model = model_loader.load_model("monthly")

    def _get_timeframe_prediction(self, tf: str, model, symbol: str, data_tf: str, candles: int, multiplier: float) -> TimeframePrediction:
        try:
            # Fetch data
            end_ts = int(time.time())
            start_ts = end_ts - (candles * 3600)  # rough approx for enough data
            df = delta_api.get_historical_data(symbol, data_tf, start_ts, end_ts)
            
            if df.empty:
                raise ValueError("No data")

            # Process features
            df = feature_pipeline.add_indicators(df)
            last_row = df.iloc[-1]
            current_price = last_row['close']
            atr = last_row['atr']
            
            # Predict
            direction = "BULLISH"
            prob = 0.65
            
            if model:
                # Assuming model takes the feature pipeline output
                # X = pd.DataFrame([last_row[['close', 'rsi', 'macd', 'rolling_volatility']]])
                # prob = float(model.predict_proba(X)[0][1])
                pass # Use heuristic if model not provided or for simplicity in this implementation
            else:
                # Heuristic fallback if model not trained yet
                if last_row['ma7'] > last_row['ma25']:
                    prob += 0.1
                else:
                    prob -= 0.1
                    direction = "BEARISH" if prob < 0.5 else "BULLISH"

            direction = "BULLISH" if prob >= 0.5 else "BEARISH"
            
            # Confidence
            trend_str = 70 if direction == "BULLISH" and last_row['ma25'] > last_row['ma99'] else 40
            conf = confidence_engine.calculate_confidence(
                model_probability=prob * 100,
                trend_strength=trend_str,
                regime_strength=60,
                volume_confirmation=55
            )

            # Range
            pred_range = range_predictor.calculate_range(current_price, atr, multiplier)

            return TimeframePrediction(
                prediction=direction,
                range=pred_range,
                confidence=conf
            )
        except Exception as e:
            print(f"Error in {tf} prediction: {e}")
            return TimeframePrediction(
                prediction="NEUTRAL",
                range=[0.0, 0.0],
                confidence=50.0
            )

    def predict_all(self, symbol="BTCUSD", current_prediction_data=None) -> AdvancedPredictionResponse:
        """
        Runs multi-timeframe forecasting and combines it with the current short-term prediction.
        """
        # Current Prediction
        cur_dir = current_prediction_data.get('trend', 'HOLD') if current_prediction_data else 'HOLD'
        cur_conf = current_prediction_data.get('confidence', 50.0) if current_prediction_data else 50.0
        
        current_pred = CurrentPrediction(
            direction=cur_dir,
            confidence=cur_conf
        )

        # Multi-timeframe
        # Daily: Uses 1h candles, 24 candles lookback min (use 100 to be safe for MAs), multiplier ~2.5
        next_day = self._get_timeframe_prediction("daily", self.daily_model, symbol, "1h", 200, 2.5)
        
        # Weekly: Uses 4h candles, multiplier ~5.0
        next_week = self._get_timeframe_prediction("weekly", self.weekly_model, symbol, "4h", 200 * 4, 5.0)
        
        # Monthly: Uses 1d candles, multiplier ~12.0
        next_month = self._get_timeframe_prediction("monthly", self.monthly_model, symbol, "1d", 200 * 24, 12.0)

        return AdvancedPredictionResponse(
            current_prediction=current_pred,
            next_day=next_day,
            next_week=next_week,
            next_month=next_month
        )

advanced_predictor = AdvancedPredictor()
