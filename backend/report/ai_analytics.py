import pandas as pd
import numpy as np

class AIAnalytics:
    """
    Analyzes AI model prediction accuracy and confidence.
    """
    @staticmethod
    def analyze_predictions(trades):
        if not trades:
            return {}

        # Extract AI metadata from trades
        ai_data = []
        for t in trades:
            meta = t.get('ai_metadata')
            if meta and isinstance(meta, dict):
                meta['pnl'] = t['pnl']
                ai_data.append(meta)
        
        if not ai_data:
            return {"status": "No AI metadata found in trades"}

        df = pd.DataFrame(ai_data)
        
        # Accuracy by confidence level
        # Assuming meta has 'confidence' and 'prediction' (BUY/SELL)
        if 'confidence' in df.columns:
            df['is_correct'] = df.apply(lambda x: (x['pnl'] > 0), axis=1) # Simplified: PnL > 0 means prediction was right directionally
            
            # Group by confidence buckets
            df['conf_bucket'] = pd.cut(df['confidence'], bins=[0, 0.5, 0.7, 0.8, 0.9, 1.0])
            conf_accuracy = df.groupby('conf_bucket')['is_correct'].mean().to_dict()
            
            return {
                "accuracy_by_confidence": {str(k): float(v) for k, v in conf_accuracy.items()},
                "avg_confidence": float(df['confidence'].mean()),
                "prediction_distribution": df['prediction'].value_counts().to_dict() if 'prediction' in df.columns else {}
            }
            
        return {"status": "Incomplete AI metadata"}
