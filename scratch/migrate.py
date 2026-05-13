from database.db import engine, Base
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Starting migration...")
        
        # Add available_balance to wallet
        try:
            conn.execute(text("ALTER TABLE wallet ADD COLUMN available_balance FLOAT DEFAULT 10000.0"))
            conn.execute(text("UPDATE wallet SET available_balance = balance WHERE available_balance IS NULL"))
            print("Added available_balance to wallet.")
        except Exception as e:
            print(f"Note: Could not add available_balance (might already exist): {e}")

        # Add mode to trades
        try:
            conn.execute(text("ALTER TABLE trades ADD COLUMN mode VARCHAR(20) DEFAULT 'REAL'"))
            print("Added mode to trades.")
        except Exception as e:
            print(f"Note: Could not add mode to trades: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
