from backend.utils.delta_client import delta_client
from backend.utils.logger import logger

class OrderbookAnalyzer:
    def __init__(self, symbol="BTCUSD"):
        self.symbol = symbol

    def analyze_imbalance(self, symbol=None) -> dict:
        """
        Analyzes the L2 orderbook for depth and imbalance.
        """
        target_symbol = symbol or self.symbol
        try:
            book = delta_client.get_l2_orderbook(target_symbol)
            bids = book.get("bids", [])
            asks = book.get("asks", [])
            
            if not bids or not asks:
                return {"imbalance": 0, "buy_walls": 0, "sell_walls": 0}

            # Calculate total depth in top 10 levels
            bid_vol = sum([float(b["size"]) for b in bids[:10]])
            ask_vol = sum([float(a["size"]) for a in asks[:10]])
            
            total_vol = bid_vol + ask_vol
            imbalance = (bid_vol - ask_vol) / total_vol if total_vol > 0 else 0
            
            # Identify "Walls" (orders > 3x average level size)
            avg_bid_size = bid_vol / 10
            avg_ask_size = ask_vol / 10
            
            buy_walls = [float(b["price"]) for b in bids[:20] if float(b["size"]) > avg_bid_size * 3]
            sell_walls = [float(a["price"]) for a in asks[:20] if float(a["size"]) > avg_ask_size * 3]
            
            return {
                "imbalance": round(imbalance, 4),
                "buy_vol": round(bid_vol, 2),
                "ask_vol": round(ask_vol, 2),
                "buy_walls": buy_walls,
                "sell_walls": sell_walls,
                "bias": "BULLISH" if imbalance > 0.2 else "BEARISH" if imbalance < -0.2 else "NEUTRAL"
            }
        except Exception as e:
            logger.error(f"Orderbook Analysis Error: {e}")
            return {"imbalance": 0, "bias": "NEUTRAL", "error": str(e)}

orderbook_analyzer = OrderbookAnalyzer()
