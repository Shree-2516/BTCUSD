import sys
import os
from datetime import datetime, timedelta

# Ensure project root in PATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

import pandas as pd
import numpy as np
from backend.NEWS.storage.news_repository import NewsRepository

def main():
    print("Initializing Historical Sentiment Analysis Script...")
    
    # 1. Fetch Stored News Articles
    print("Fetching articles from database...")
    try:
        articles = NewsRepository.get_latest_articles(limit=500)
    except Exception as e:
        print(f"Database query failed: {e}. Generating mock dataset...")
        articles = []
        
    data = []
    for art in articles:
        data.append({
            'id': art.id,
            'title': art.title,
            'summary': art.summary,
            'source': art.source,
            'published_at': art.published_at,
            'sentiment': art.sentiment,
            'confidence': art.confidence
        })
        
    df = pd.DataFrame(data)
    if df.empty:
        print("No articles found in database. Using mock data.")
        df = pd.DataFrame({
            'id': [1, 2, 3],
            'title': ['Mock news 1', 'Mock news 2', 'Mock news 3'],
            'summary': ['summary 1', 'summary 2', 'summary 3'],
            'source': ['CoinDesk', 'CoinTelegraph', 'Yahoo Finance'],
            'published_at': [datetime.utcnow() - timedelta(days=i) for i in range(3)],
            'sentiment': ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
            'confidence': [0.95, 0.85, 0.75]
        })
        
    print(f"Total articles analyzed: {len(df)}")
    print(df.head())
    
    # 2. Sentiment Statistics & Distributions
    print("\n=== Sentiment Counts ===")
    print(df['sentiment'].value_counts())
    
    print("\n=== Average Sentiment Confidence ===")
    if 'sentiment' in df.columns and 'confidence' in df.columns:
        print(df.groupby('sentiment')['confidence'].mean())
    else:
        print("Sentiment confidence columns not fully populated.")
        
    # 3. Analyze Historical Signal Evolution
    print("\n=== Daily Sentiment Signal Evolution ===")
    df['date'] = pd.to_datetime(df['published_at']).dt.date

    def calculate_daily_sentiment(group):
        pos = group[group['sentiment'] == 'POSITIVE']['confidence'].sum()
        neg = group[group['sentiment'] == 'NEGATIVE']['confidence'].sum()
        neu = group[group['sentiment'] == 'NEUTRAL']['confidence'].sum()
        total = pos + neg + neu
        
        if total == 0:
            return 'NEUTRAL'
        
        winning = np.argmax([pos, neg, neu])
        signals = ['POSITIVE', 'NEGATIVE', 'NEUTRAL']
        return signals[winning]

    daily_trends = df.groupby('date').apply(calculate_daily_sentiment)
    print(daily_trends.head(10))

if __name__ == '__main__':
    main()
