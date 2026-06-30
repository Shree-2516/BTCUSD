from pydantic import BaseModel
from typing import List

class TimeframePrediction(BaseModel):
    prediction: str
    range: List[float]
    confidence: float

class CurrentPrediction(BaseModel):
    direction: str
    confidence: float

class AdvancedPredictionResponse(BaseModel):
    current_prediction: CurrentPrediction
    next_day: TimeframePrediction
    next_week: TimeframePrediction
    next_month: TimeframePrediction
