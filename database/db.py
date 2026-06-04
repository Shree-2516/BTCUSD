from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey, Index, create_engine, inspect, text
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
    used_margin = Column(Float, default=0.0)
    unrealized_pnl = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    total_equity = Column(Float, default=10000.0)
    starting_balance = Column(Float, default=10000.0)
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

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    amount = Column(Float)
    balance_after = Column(Float)
    available_after = Column(Float)
    used_margin_after = Column(Float)
    reason = Column(String)
    trade_id = Column(Integer, nullable=True)
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
    strategy_name = Column(String, nullable=True)
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    size = Column(Float)
    leverage = Column(Float, default=1.0)
    margin_used = Column(Float, default=0.0)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    trailing_stop = Column(Float, nullable=True)
    status = Column(String)  # OPEN, CLOSED
    state = Column(String, default="OPEN")
    pnl = Column(Float, default=0.0)
    unrealized_pnl = Column(Float, default=0.0)
    pnl_percentage = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    current_price = Column(Float, nullable=True)
    highest_price = Column(Float, nullable=True)
    lowest_price = Column(Float, nullable=True)
    entry_time = Column(DateTime, default=datetime.utcnow)
    exit_time = Column(DateTime, nullable=True)
    exit_reason = Column(String, nullable=True)
    fees = Column(Float, default=0.0)
    wallet_balance_after = Column(Float, nullable=True)
    signal_id = Column(String, nullable=True)
    last_candle_time = Column(DateTime, nullable=True)
    trade_type = Column(String, default="LIVE")  # LIVE, MANUAL, BACKTEST
    mode = Column(String, default="REAL") # For future expansion if needed

Index("ix_trades_status_symbol_strategy", Trade.status, Trade.symbol, Trade.strategy_name)
Index("ix_trades_signal_id", Trade.signal_id)

class TradeHistory(Base):
    __tablename__ = "trade_history"
    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, index=True)
    symbol = Column(String)
    strategy_name = Column(String, nullable=True)
    side = Column(String)
    quantity = Column(Float)
    leverage = Column(Float)
    entry_price = Column(Float)
    exit_price = Column(Float)
    entry_time = Column(DateTime)
    exit_time = Column(DateTime)
    pnl = Column(Float)
    pnl_percentage = Column(Float)
    duration_seconds = Column(Float)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    exit_reason = Column(String, nullable=True)
    fees = Column(Float, default=0.0)
    wallet_balance_after = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LiveTradeSnapshot(Base):
    __tablename__ = "live_trades"
    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, index=True)
    symbol = Column(String)
    strategy_name = Column(String, nullable=True)
    side = Column(String)
    entry_price = Column(Float)
    current_price = Column(Float)
    quantity = Column(Float)
    leverage = Column(Float)
    margin_used = Column(Float)
    unrealized_pnl = Column(Float, default=0.0)
    pnl_percentage = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)
    drawdown = Column(Float, default=0.0)
    status = Column(String, default="OPEN")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EquityCurvePoint(Base):
    __tablename__ = "equity_curve"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    balance = Column(Float)
    equity = Column(Float)
    available_balance = Column(Float)
    used_margin = Column(Float)
    unrealized_pnl = Column(Float)
    realized_pnl = Column(Float)

class StrategySession(Base):
    __tablename__ = "strategy_sessions"
    id = Column(Integer, primary_key=True, index=True)
    strategy_name = Column(String)
    symbol = Column(String, default="BTCUSD")
    status = Column(String, default="WAITING")
    started_at = Column(DateTime, default=datetime.utcnow)
    stopped_at = Column(DateTime, nullable=True)
    config = Column(Text, nullable=True)

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

def _safe_add_column(conn, table_name, column_name, ddl_type, default=None):
    inspector = inspect(conn)
    existing = {col["name"] for col in inspector.get_columns(table_name)}
    if column_name in existing:
        return
    default_sql = f" DEFAULT {default}" if default is not None else ""
    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_type}{default_sql}"))

def run_safe_migrations():
    """Add live paper-trading columns without dropping or rewriting existing data."""
    with engine.begin() as conn:
        tables = inspect(conn).get_table_names()
        if "wallet" in tables:
            for name, ddl_type, default in [
                ("used_margin", "FLOAT", "0"),
                ("unrealized_pnl", "FLOAT", "0"),
                ("realized_pnl", "FLOAT", "0"),
                ("total_equity", "FLOAT", "10000"),
                ("starting_balance", "FLOAT", "10000"),
            ]:
                _safe_add_column(conn, "wallet", name, ddl_type, default)
        if "trades" in tables:
            for name, ddl_type, default in [
                ("strategy_name", "VARCHAR", None),
                ("leverage", "FLOAT", "1"),
                ("margin_used", "FLOAT", "0"),
                ("trailing_stop", "FLOAT", None),
                ("state", "VARCHAR", "'OPEN'"),
                ("unrealized_pnl", "FLOAT", "0"),
                ("pnl_percentage", "FLOAT", "0"),
                ("roi", "FLOAT", "0"),
                ("max_drawdown", "FLOAT", "0"),
                ("current_price", "FLOAT", None),
                ("highest_price", "FLOAT", None),
                ("lowest_price", "FLOAT", None),
                ("exit_reason", "VARCHAR", None),
                ("fees", "FLOAT", "0"),
                ("wallet_balance_after", "FLOAT", None),
                ("signal_id", "VARCHAR", None),
                ("last_candle_time", "TIMESTAMP", None),
            ]:
                _safe_add_column(conn, "trades", name, ddl_type, default)

def init_db():
    Base.metadata.create_all(bind=engine)
    run_safe_migrations()
    
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
