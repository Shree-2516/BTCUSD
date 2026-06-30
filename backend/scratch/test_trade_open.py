import requests

url = "http://localhost:8000/api/trade/open"
payload = {
    "side": "BUY",
    "size": 1.0,
    "stop_loss": None,
    "take_profit": None
}

response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
