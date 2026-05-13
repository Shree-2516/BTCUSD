from utils.delta_api import delta_api
import json

ticker = delta_api.get_ticker("BTCUSD")
print(json.dumps(ticker, indent=2))
