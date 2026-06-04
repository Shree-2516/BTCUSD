from strategies.base_strategy import BaseStrategy
import pandas as pd
import numpy as np


class NewStrategyTemplate(BaseStrategy):
    """
    A production-ready plug-and-play strategy template for the BTCUSD platform.

    This strategy template demonstrates how to structure:
    - Constructor (__init__) with customizable parameters.
    - Parameter support via the self.params dictionary.
    - Standard attributes used by the backtest/live-test engines (timeframe, stop_loss, take_profit).
    - BUY / SELL entry conditions and EXIT/HOLD signal return values.
    - Risk management placeholders (Stop-Loss and Take-Profit calculations).
    """

    def __init__(self, **kwargs):
        # 1. Initialize parent BaseStrategy with a human-readable name
        name = kwargs.get("name", "New Strategy Template")
        super().__init__(name=name)

        # 2. Strategy Timeframe (e.g., '5m', '15m', '1h', '4h', '1d')
        # Used automatically by BacktestEngine and LiveTestManager
        self.timeframe = kwargs.get("timeframe", "5m")

        # 3. Parameter Dictionary (For dynamic dashboard integration/configs)
        self.params = {
            "fast_period": kwargs.get("fast_period", 10),
            "slow_period": kwargs.get("slow_period", 20),
            "rsi_period": kwargs.get("rsi_period", 14),
            "rsi_overbought": kwargs.get("rsi_overbought", 70.0),
            "rsi_oversold": kwargs.get("rsi_oversold", 30.0),
            "sl_pct": kwargs.get("sl_pct", 0.02),  # Stop-loss percentage (2%)
            "tp_pct": kwargs.get("tp_pct", 0.04),  # Take-profit percentage (4%)
        }

        # Unpack parameters as instance attributes for clean syntax
        self.fast_period = self.params["fast_period"]
        self.slow_period = self.params["slow_period"]
        self.rsi_period = self.params["rsi_period"]
        self.rsi_overbought = self.params["rsi_overbought"]
        self.rsi_oversold = self.params["rsi_oversold"]
        self.sl_pct = self.params["sl_pct"]
        self.tp_pct = self.params["tp_pct"]

        # 4. State tracking variables
        self.position = None        # 'BUY', 'SELL', or None
        self.pending_exit = None    # Next signal to return (e.g., 'EXIT_BUY', 'EXIT_SELL')
        self.last_processed_time = None

        # 5. Risk management price levels (accessed by BacktestEngine for intra-candle exits)
        self.stop_loss = None       # Absolute price level for stop-loss
        self.take_profit = None     # Absolute price level for take-profit

    def on_bar(self, bar, history):
        """
        Calculates trading signals on each candle close.

        Args:
            bar (pandas.Series): The current forming or last completed candle.
            history (pandas.DataFrame): DataFrame of historical candles.
                - In BacktestEngine: Contains data up to (and including) the previous candle.
                - In LiveTestManager: Contains all completed candles.

        Returns:
            str or None: 'BUY', 'SELL', 'EXIT_BUY', 'EXIT_SELL', or None (representing HOLD)
        """
        # A. Prevent double processing of the same candle (especially in live trading)
        bar_time = getattr(bar, "name", None)
        if bar_time is not None and bar_time == self.last_processed_time:
            return None
        self.last_processed_time = bar_time

        # B. Handle any pending exits queued from a previous bar
        if self.pending_exit:
            signal = self.pending_exit
            self.pending_exit = None
            self.position = None
            # Reset risk management levels on exit
            self.stop_loss = None
            self.take_profit = None
            return signal

        # C. Ensure minimum history size for indicators
        required_candles = max(self.slow_period, self.rsi_period) + 5
        if history is None or len(history) < required_candles:
            return None

        # D. Safe copy of history to calculate technical indicators
        df = history.copy()

        # E. INDICATOR CALCULATIONS (Using self.fast_period, self.slow_period, etc.)
        # Calculate Fast EMA
        df['ema_fast'] = df['close'].ewm(span=self.fast_period, adjust=False).mean()
        # Calculate Slow EMA
        df['ema_slow'] = df['close'].ewm(span=self.slow_period, adjust=False).mean()

        # Calculate RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_period).mean()
        rs = gain / (loss + 1e-10)
        df['rsi'] = 100 - (100 / (1 + rs))

        # Retrieve current and previous values of indicators for crossovers
        current_fast = df['ema_fast'].iloc[-1]
        current_slow = df['ema_slow'].iloc[-1]
        previous_fast = df['ema_fast'].iloc[-2]
        previous_slow = df['ema_slow'].iloc[-2]

        current_rsi = df['rsi'].iloc[-1]
        current_price = float(df['close'].iloc[-1])

        # F. TRADING SIGNALS LOGIC
        # 1. BUY SIGNAL: Fast EMA crosses ABOVE Slow EMA + RSI not overbought
        if (previous_fast <= previous_slow and current_fast > current_slow) and (current_rsi < self.rsi_overbought):

            # If we are currently in a SELL position, we must exit it first
            if self.position == "SELL":
                self.position = None
                self.stop_loss = None
                self.take_profit = None
                return "EXIT_SELL"

            # Otherwise, initiate a fresh BUY position
            if self.position != "BUY":
                self.position = "BUY"

                # RISK MANAGEMENT PLACEHOLDERS: Set stop-loss and take-profit absolute levels
                # E.g., placing stop-loss 2% below the entry price, and take-profit 4% above
                self.stop_loss = current_price * (1.0 - self.sl_pct)
                self.take_profit = current_price * (1.0 + self.tp_pct)

                return "BUY"

        # 2. SELL SIGNAL: Fast EMA crosses BELOW Slow EMA + RSI not oversold
        elif (previous_fast >= previous_slow and current_fast < current_slow) and (current_rsi > self.rsi_oversold):

            # If we are currently in a BUY position, we must exit it first
            if self.position == "BUY":
                self.position = None
                self.stop_loss = None
                self.take_profit = None
                return "EXIT_BUY"

            # Otherwise, initiate a fresh SELL position
            if self.position != "SELL":
                self.position = "SELL"

                # RISK MANAGEMENT PLACEHOLDERS: Set stop-loss and take-profit absolute levels
                # E.g., placing stop-loss 2% above the entry price, and take-profit 4% below
                self.stop_loss = current_price * (1.0 + self.sl_pct)
                self.take_profit = current_price * (1.0 - self.tp_pct)

                return "SELL"

        # 3. DYNAMIC EXIT CONDITIONS (Optional addition to stop-loss/take-profit)
        if self.position == "BUY":
            # Example: Exit long if RSI becomes extremely overbought
            if current_rsi >= 85.0:
                self.position = None
                self.stop_loss = None
                self.take_profit = None
                return "EXIT_BUY"

        elif self.position == "SELL":
            # Example: Exit short if RSI becomes extremely oversold
            if current_rsi <= 15.0:
                self.position = None
                self.stop_loss = None
                self.take_profit = None
                return "EXIT_SELL"

        # G. DEFAULT SIGNAL: RETURN None (acts as HOLD / NO ACTION in the platform)
        return None

    def get_signal(self, df):
        """
        Optional vectorized signal generation for faster backtesting.
        If implemented, can speed up backtest runs significantly over large datasets.
        """
        return super().get_signal(df)
