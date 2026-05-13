from strategies.base_strategy import BaseStrategy
import pandas as pd


class SimpleEMA5Min(BaseStrategy):
    def __init__(self, fast_period=9, slow_period=15):
        super().__init__(name="5 Min EMA Crossover")

        self.fast_period = fast_period
        self.slow_period = slow_period

        self.position = None   # BUY / SELL
        self.timeframe = "5m"  # Strategy timeframe

    def on_bar(self, bar, history):

        # Make sure enough candles are available
        if len(history) < self.slow_period + 5:
            return None

        # ---------------------------------
        # EMA Calculation
        # ---------------------------------
        history = history.copy()

        history['ema_fast'] = (
            history['close']
            .ewm(span=self.fast_period, adjust=False)
            .mean()
        )

        history['ema_slow'] = (
            history['close']
            .ewm(span=self.slow_period, adjust=False)
            .mean()
        )

        # Current candle EMA
        current_fast = history['ema_fast'].iloc[-1]
        current_slow = history['ema_slow'].iloc[-1]

        # Previous candle EMA
        previous_fast = history['ema_fast'].iloc[-2]
        previous_slow = history['ema_slow'].iloc[-2]

        # ---------------------------------
        # BUY ENTRY
        # 9 EMA crosses ABOVE 15 EMA
        # ---------------------------------
        if previous_fast <= previous_slow and current_fast > current_slow:

            # Exit SELL first
            if self.position == "SELL":
                self.position = None
                return "EXIT_SELL"

            # Fresh BUY entry
            if self.position != "BUY":
                self.position = "BUY"
                return "BUY"

        # ---------------------------------
        # SELL ENTRY
        # 9 EMA crosses BELOW 15 EMA
        # ---------------------------------
        if previous_fast >= previous_slow and current_fast < current_slow:

            # Exit BUY first
            if self.position == "BUY":
                self.position = None
                return "EXIT_BUY"

            # Fresh SELL entry
            if self.position != "SELL":
                self.position = "SELL"
                return "SELL"

        return None