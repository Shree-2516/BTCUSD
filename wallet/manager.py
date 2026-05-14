from database.db import SessionLocal, Wallet, Transaction, Base, engine
from datetime import datetime
from sqlalchemy import desc

class WalletManager:
    def __init__(self):
        # We don't initialize balance here anymore, it's in the DB
        pass

    def get_session(self):
        return SessionLocal()

    def get_wallet(self, db):
        wallet = db.query(Wallet).first()
        if not wallet:
            wallet = Wallet(balance=10000.0)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return wallet

    def add_funds(self, amount, reason="Deposit"):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            wallet.balance += amount
            wallet.available_balance += amount
            
            transaction = Transaction(
                type="CREDIT",
                amount=amount,
                balance_after=wallet.balance,
                reason=reason
            )
            db.add(transaction)
            db.commit()
            return wallet.balance
        finally:
            db.close()

    def withdraw_funds(self, amount, reason="Withdrawal"):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            if wallet.available_balance >= amount:
                wallet.available_balance -= amount
                # Balance remains same as it's just reserved
                
                transaction = Transaction(
                    type="DEBIT",
                    amount=amount,
                    balance_after=wallet.available_balance,
                    reason=reason
                )
                db.add(transaction)
                db.commit()
                return wallet.available_balance
            else:
                raise ValueError("Insufficient available funds")
        finally:
            db.close()

    def get_status(self):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            return {
                "balance": wallet.balance,
                "available_balance": wallet.available_balance,
                "currency": wallet.currency
            }
        finally:
            db.close()

    def get_history(self, limit=50):
        db = self.get_session()
        try:
            transactions = db.query(Transaction).order_by(desc(Transaction.timestamp)).limit(limit).all()
            return [
                {
                    "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "type": t.type,
                    "amount": t.amount,
                    "balance_after": t.balance_after,
                    "reason": t.reason
                }
                for t in transactions
            ]
        finally:
            db.close()

    def settle_trade(self, cost, pnl, reason="Trade Settlement"):
        """Called when a trade is closed. cost is the reserved amount, pnl is profit/loss."""
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            wallet.balance += pnl
            wallet.available_balance += (cost + pnl)
            
            transaction = Transaction(
                type="SETTLEMENT",
                amount=pnl,
                balance_after=wallet.balance,
                reason=reason
            )
            db.add(transaction)
            db.commit()
            return wallet.balance
        finally:
            db.close()

    def reset_wallet(self):
        db = self.get_session()
        try:
            # 1. Delete all transactions
            db.query(Transaction).delete()
            
            # 2. Reset wallet balance to zero
            wallet = self.get_wallet(db)
            wallet.balance = 0.0
            wallet.available_balance = 0.0
            
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error resetting wallet: {e}")
            return False
        finally:
            db.close()

wallet_manager = WalletManager()
