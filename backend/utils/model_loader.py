import os
import joblib

class ModelLoader:
    def __init__(self, base_path="BTCPREDICT/models"):
        self.base_path = base_path

    def load_model(self, timeframe: str):
        """
        Loads the most appropriate model for the given timeframe (daily, weekly, monthly).
        Currently supports joblib models. Can be extended to PyTorch/TensorFlow.
        """
        model_dir = os.path.join(self.base_path, timeframe)
        if not os.path.exists(model_dir):
            return None

        # Look for a .pkl or .joblib file
        for file in os.listdir(model_dir):
            if file.endswith('.pkl') or file.endswith('.joblib'):
                model_path = os.path.join(model_dir, file)
                try:
                    return joblib.load(model_path)
                except Exception as e:
                    print(f"Error loading model {model_path}: {e}")
        
        return None

model_loader = ModelLoader()
