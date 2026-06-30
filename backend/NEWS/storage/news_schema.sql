-- Schema for News Sentiment & BTCUSD Signal Engine
-- Dialect: PostgreSQL

-- Table: news_articles
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url TEXT UNIQUE,
    published_at TIMESTAMP NOT NULL,
    sentiment VARCHAR(20),
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying news by URL or published time
CREATE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(url);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);

-- Table: market_sentiment
CREATE TABLE IF NOT EXISTS market_sentiment (
    id SERIAL PRIMARY KEY,
    signal VARCHAR(20) NOT NULL,
    confidence INT NOT NULL,
    positive_count INT NOT NULL,
    neutral_count INT NOT NULL,
    negative_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for ordering/filtering market sentiment
CREATE INDEX IF NOT EXISTS idx_market_sentiment_created_at ON market_sentiment(created_at);

-- Table: news_summaries
CREATE TABLE IF NOT EXISTS news_summaries (
    id SERIAL PRIMARY KEY,
    topics TEXT NOT NULL, -- JSON string of topics and summaries
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_summaries_created_at ON news_summaries(created_at);
