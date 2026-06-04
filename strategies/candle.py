from strategies.base_strategy import BaseStrategy


class TwoCandleReversal5Min(BaseStrategy):
    """
    5-minute BTC/USDT candle reversal strategy.

    Backtest engine calls on_bar with the last closed candle and executes the
    returned signal at the next candle open. Live test calls it on the current
    forming candle, with history containing closed candles, so this class uses
    only the last two closed candles from history for entry decisions.
    """
    def __init__(self):
        super().__init__(name="Two Candle Reversal 5m")
        self.timeframe = "5m"
        self.position = None
        self.pending_exit = None
        self.last_processed_time = None

    @staticmethod 
    def _is_bearish(candle):
        return float(candle["close"]) < float(candle["open"])

    @staticmethod
    def _is_bullish(candle):
        return float(candle["close"]) > float(candle["open"])

    def on_bar(self, bar, history):
        bar_time = getattr(bar, "name", None)
        if bar_time is not None and bar_time == self.last_processed_time:
            return None
        self.last_processed_time = bar_time

        if self.pending_exit:
            signal = self.pending_exit
            self.pending_exit = None
            self.position = None
            return signal

        if history is None or len(history) < 2:
            return None

        last_two = history.iloc[-2:]
        first = last_two.iloc[0]
        second = last_two.iloc[1]

        if self._is_bearish(first) and self._is_bearish(second):
            self.position = "BUY"
            self.pending_exit = "EXIT_BUY"
            return "BUY"

        if self._is_bullish(first) and self._is_bullish(second):
            self.position = "SELL"
            self.pending_exit = "EXIT_SELL"
            return "SELL"

        return None
