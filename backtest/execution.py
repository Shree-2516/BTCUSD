from backtest.slippage import FixedSlippage

class ExecutionHandler:
    """
    Handles trade execution simulation, including slippage and commission calculations.
    """
    def __init__(self, slippage_model=None, commission_rate=0.0005):
        # Default to 0.05% Taker fee if not specified
        self.slippage_model = slippage_model or FixedSlippage(0.0001)
        self.commission_rate = commission_rate

    def get_fill_price(self, price, side, vol=0):
        """Calculates the final entry/exit price after slippage."""
        return self.slippage_model.apply(price, side, vol=vol)

    def calculate_commission(self, price, size):
        """Calculates the trading fee."""
        return price * size * self.commission_rate
