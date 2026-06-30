import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.insights.layered_engine import layered_prediction_engine
from backend.utils.logger import logger

def test_layered_prediction():
    logger.info("Starting Layered Prediction Test...")
    try:
        prediction = layered_prediction_engine.get_layered_prediction("BTCUSD")
        import json
        print(json.dumps(prediction, indent=4))
        
        if "signal" in prediction:
            logger.info("SUCCESS: Prediction generated successfully.")
        else:
            logger.error("FAILED: Prediction missing signal field.")
            
    except Exception as e:
        logger.error(f"Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_layered_prediction()
