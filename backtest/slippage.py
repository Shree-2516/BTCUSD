class SlippageModel:
    def apply(self, price, side, **kwargs):
        raise NotImplementedError

class FixedSlippage(SlippageModel):
    """
    Applies a fixed percentage of slippage to every trade.
    """
    def __init__(self, slippage_pct=0.0002): # Default 0.02% (2 basis points)
        self.slippage_pct = slippage_pct

    def apply(self, price, side, **kwargs):
        if side == 'BUY':
            return price * (1 + self.slippage_pct)
        elif side == 'SELL':
            return price * (1 - self.slippage_pct)
        return price

class VolatilitySlippage(SlippageModel):
    """
    Slippage increases with market volatility.
    """
    def __init__(self, base_pct=0.0001, vol_multiplier=0.1):
        self.base_pct = base_pct
        self.vol_multiplier = vol_multiplier

    def apply(self, price, side, vol=0, **kwargs):
        slippage = self.base_pct + (vol * self.vol_multiplier)
        if side == 'BUY':
            return price * (1 + slippage)
        elif side == 'SELL':
            return price * (1 - slippage)
        return price
