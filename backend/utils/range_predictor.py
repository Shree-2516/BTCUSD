class RangePredictor:
    @staticmethod
    def calculate_range(current_price: float, atr: float, multiplier: float = 2.5) -> list:
        """
        Generates expected BTC price ranges using ATR and a multiplier.
        """
        expected_move = atr * multiplier
        upper = current_price + expected_move
        lower = current_price - expected_move
        
        # Format to 2 decimal places
        return [round(lower, 2), round(upper, 2)]

range_predictor = RangePredictor()
