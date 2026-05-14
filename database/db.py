from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/trading_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Wallet(Base):
    __tablename__ = "wallet"
    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=10000.0)  # Total Balance (Cash)
    available_balance = Column(Float, default=10000.0) # Available for trading
    currency = Column(String, default="USDT")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # CREDIT, DEBIT
    amount = Column(Float)
    balance_after = Column(Float)
    reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class BacktestReport(Base):
    __tablename__ = "backtest_reports"
    id = Column(Integer, primary_key=True, index=True)
    strategy_name = Column(String)
    initial_capital = Column(Float)
    final_capital = Column(Float)
    net_pnl = Column(Float)
    win_rate = Column(Float)
    total_trades = Column(Integer)
    max_drawdown = Column(Float)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    report_data = Column(Text)  # JSON string of the full report
    created_at = Column(DateTime, default=datetime.utcnow)

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, default="BTCUSD")
    type = Column(String)  # BUY, SELL
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    size = Column(Float)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    status = Column(String)  # OPEN, CLOSED
    pnl = Column(Float, default=0.0)
    entry_time = Column(DateTime, default=datetime.utcnow)
    exit_time = Column(DateTime, nullable=True)
    trade_type = Column(String, default="LIVE")  # LIVE, MANUAL, BACKTEST
    mode = Column(String, default="REAL") # For future expansion if needed

class StrategyConfig(Base):
    __tablename__ = "strategies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    parameters = Column(Text) # JSON string of parameters
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_balance = Column(Float)
    unrealized_pnl = Column(Float)
    daily_return = Column(Float, default=0.0)
    sharpe_ratio = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    open_trades_count = Column(Integer, default=0)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Initialize wallet if it doesn't exist
    db = SessionLocal()
    if db.query(Wallet).count() == 0:
        wallet = Wallet(balance=10000.0, available_balance=10000.0)
        db.add(wallet)
        db.commit()
    db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
