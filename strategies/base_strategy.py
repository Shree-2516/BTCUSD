class BaseStrategy:
    def __init__(self, name="Base Strategy"):
        self.name = name
        self.params = {}

    def on_bar(self, bar, history):
        """
        Logic to be executed on each new candle.
        bar: current candle (Series)
        history: past candles (DataFrame)
        Returns: 'BUY', 'SELL', or None
        """
        pass

    def get_signal(self, df):
        """
        Optional: Vectorized signal generation for faster backtesting
        """
        return None
