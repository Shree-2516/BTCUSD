from utils.delta_api import delta_api
from datetime import datetime

start_ts = int(datetime(2010, 1, 1).timestamp())
end_ts = int(datetime.now().timestamp())

for res in ["1d", "1w"]:
    print(f"Resolution: {res}")
    df = delta_api.get_historical_data("BTCUSD", res, start_ts, end_ts)
    if not df.empty:
        print(f"First date: {df.index[0]}")
        print(f"First Open: {df.iloc[0]['open']}")
    else:
        print("No data")
