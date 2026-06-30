import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import torch
from backend.utils.logger import logger
from backend.NEWS.utils.text_cleaner import TextCleaner


# Import transformers locally to avoid slow import when importing other utilities
# The model will be lazy-loaded on the first `analyze` call.
class FinBERTAnalyzer:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(FinBERTAnalyzer, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
        
    def __init__(self):
        if self.initialized:
            return
            
        self.model_name = "ProsusAI/finbert"
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "finbert_cache")
        os.makedirs(self.cache_dir, exist_ok=True)
        self.nlp = None
        self.initialized = True
        
    def _init_pipeline(self):
        if self.nlp is None:
            logger.info("Initializing FinBERT model and tokenizer...")
            try:
                from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
                
                device = 0 if torch.cuda.is_available() else -1
                logger.info(f"Loading FinBERT on device: {'CUDA/GPU (0)' if device == 0 else 'CPU (-1)'}")
                
                tokenizer = AutoTokenizer.from_pretrained(self.model_name, cache_dir=self.cache_dir)
                model = AutoModelForSequenceClassification.from_pretrained(self.model_name, cache_dir=self.cache_dir)
                
                self.nlp = pipeline(
                    "sentiment-analysis",
                    model=model,
                    tokenizer=tokenizer,
                    device=device
                )
                logger.info("FinBERT model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load FinBERT model: {e}")
                raise e
                
    def analyze(self, text: str):
        """
        Classifies financial text into POSITIVE, NEUTRAL, or NEGATIVE.
        Returns a tuple: (sentiment_label, confidence_score)
        """
        cleaned_text = TextCleaner.clean(text)
        if not cleaned_text:
            return "NEUTRAL", 0.0
            
        self._init_pipeline()
        
        try:
            # FinBERT has a max length limit of 512 tokens.
            # pipeline handles truncation if we pass truncation=True.
            result = self.nlp(cleaned_text, truncation=True, max_length=512)[0]
            
            # Map labels to UPPERCASE standard
            label = result["label"].upper() # 'positive', 'negative', 'neutral' -> 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
            score = float(result["score"])
            
            return label, score
        except Exception as e:
            logger.error(f"Error during sentiment analysis run: {e}")
            return "NEUTRAL", 0.0
