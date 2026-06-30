from backend.utils.delta_api import delta_api
import json
from datetime import datetime
import pandas as pd

start_ts = int(datetime(2015, 1, 1).timestamp())
end_ts = int(datetime.now().timestamp())

df = delta_api.get_historical_data("BTCUSD", "1d", start_ts, end_ts)

if not df.empty:
    print(f"Columns: {df.columns.tolist()}")
    print(f"First row: \n{df.iloc[0]}")
else:
    print("No data found")
