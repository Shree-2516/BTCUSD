class ConfidenceEngine:
    @staticmethod
    def calculate_confidence(model_probability: float, trend_strength: float, regime_strength: float, volume_confirmation: float) -> float:
        """
        Calculates a unified confidence score from 0-100.
        All inputs should be normalized between 0 and 100.
        """
        # Ensure all inputs are bounded
        p = max(0, min(100, model_probability))
        t = max(0, min(100, trend_strength))
        r = max(0, min(100, regime_strength))
        v = max(0, min(100, volume_confirmation))
        
        confidence = (p + t + r + v) / 4.0
        return round(confidence, 2)

confidence_engine = ConfidenceEngine()
