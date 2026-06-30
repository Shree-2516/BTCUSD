from backend.utils.delta_api import delta_api
import json
from datetime import datetime

# Try fetching from a very old timestamp
start_ts = int(datetime(2015, 1, 1).timestamp())
end_ts = int(datetime.now().timestamp())

print(f"Fetching data from {datetime.fromtimestamp(start_ts)}...")
df = delta_api.get_historical_data("BTCUSD", "1d", start_ts, end_ts)

if not df.empty:
    first_candle = df.iloc[0]
    last_candle = df.iloc[-1]
    
    first_date = datetime.fromtimestamp(first_candle["time"])
    print(f"Earliest data found: {first_date}")
    print(f"First Open Price: {first_candle['open']}")
    print(f"Current Close Price: {last_candle['close']}")
    
    roi = ((float(last_candle['close']) - float(first_candle['open'])) / float(first_candle['open'])) * 100
    print(f"Max ROI: {roi:.2f}%")
else:
    print("No historical data found.")
