import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

class ConfigManager:
    def __init__(self):
        # API Keys
        self.DELTA_API_KEY = os.getenv("DELTA_API_KEY")
        self.DELTA_API_SECRET = os.getenv("DELTA_API_SECRET")
        self.GROQ_API_KEY = os.getenv("GROQ_API")
        
        # Model Settings
        self.GROQ_MODEL = "llama-3.3-70b-versatile"
        self.PROBABILITY_THRESHOLD = 0.60  # Only trade if confidence > 60%
        
        # Feature Settings
        self.TIMEFRAMES = ["5m", "15m", "1h"]
        self.LOOKBACK_CANDLES = 200
        
        # Risk Settings
        self.MAX_SLIPPAGE = 0.001  # 0.1%
        self.DEFAULT_LEVERAGE = 1
        
        # Database
        self.POSTGRES_URL = os.getenv("POSTGRES_URL")

    def get_all(self) -> Dict[str, Any]:
        return self.__dict__

config = ConfigManager()
