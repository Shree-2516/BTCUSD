from database.db import SessionLocal, Wallet, Transaction, WalletTransaction
from sqlalchemy import desc
from utils.logger import logger


class WalletManager:
    def get_session(self):
        return SessionLocal()

    def get_wallet(self, db):
        wallet = db.query(Wallet).first()
        if not wallet:
            wallet = Wallet(
                balance=10000.0,
                available_balance=10000.0,
                used_margin=0.0,
                unrealized_pnl=0.0,
                realized_pnl=0.0,
                total_equity=10000.0,
                starting_balance=10000.0,
            )
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        self._normalize_wallet(wallet)
        return wallet

    def _normalize_wallet(self, wallet):
        wallet.balance = float(wallet.balance or 0.0)
        wallet.available_balance = float(wallet.available_balance if wallet.available_balance is not None else wallet.balance)
        wallet.used_margin = float(getattr(wallet, "used_margin", 0.0) or 0.0)
        wallet.unrealized_pnl = float(getattr(wallet, "unrealized_pnl", 0.0) or 0.0)
        wallet.realized_pnl = float(getattr(wallet, "realized_pnl", 0.0) or 0.0)
        wallet.total_equity = wallet.balance + wallet.unrealized_pnl
        if getattr(wallet, "starting_balance", None) is None:
            wallet.starting_balance = wallet.balance

    def _record_transaction(self, db, wallet, tx_type, amount, reason, trade_id=None):
        db.add(Transaction(
            type=tx_type,
            amount=float(amount),
            balance_after=wallet.balance,
            reason=reason,
        ))
        db.add(WalletTransaction(
            type=tx_type,
            amount=float(amount),
            balance_after=wallet.balance,
            available_after=wallet.available_balance,
            used_margin_after=wallet.used_margin,
            reason=reason,
            trade_id=trade_id,
        ))

    def add_funds(self, amount, reason="Deposit"):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            amount = float(amount)
            wallet.balance += amount
            wallet.available_balance += amount
            wallet.total_equity = wallet.balance + wallet.unrealized_pnl
            self._record_transaction(db, wallet, "CREDIT", amount, reason)
            db.commit()
            return wallet.balance
        except Exception as e:
            db.rollback()
            logger.error(f"Wallet deposit failed: {e}")
            raise
        finally:
            db.close()

    def withdraw_funds(self, amount, reason="Withdrawal"):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            amount = float(amount)
            if wallet.available_balance < amount:
                raise ValueError("Insufficient available funds")
            wallet.available_balance -= amount
            self._record_transaction(db, wallet, "DEBIT", amount, reason)
            db.commit()
            return wallet.available_balance
        except Exception as e:
            db.rollback()
            logger.error(f"Wallet withdrawal failed: {e}")
            raise
        finally:
            db.close()

    def reserve_margin(self, amount, reason="Margin Reserved", trade_id=None):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Margin amount must be positive")
            if wallet.available_balance < amount:
                raise ValueError(
                    f"Insufficient margin. Required {amount:.2f} {wallet.currency}, "
                    f"available {wallet.available_balance:.2f} {wallet.currency}"
                )
            wallet.available_balance -= amount
            wallet.used_margin += amount
            wallet.total_equity = wallet.balance + wallet.unrealized_pnl
            self._record_transaction(db, wallet, "MARGIN_BLOCK", amount, reason, trade_id)
            db.commit()
            return wallet.available_balance
        except Exception as e:
            db.rollback()
            logger.error(f"Margin reserve failed: {e}")
            raise
        finally:
            db.close()

    def settle_trade(self, margin_used, pnl, reason="Trade Settlement", trade_id=None):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            margin_used = float(margin_used or 0.0)
            pnl = float(pnl or 0.0)
            wallet.balance += pnl
            wallet.available_balance += margin_used
            wallet.used_margin = max(0.0, wallet.used_margin - margin_used)
            wallet.realized_pnl += pnl
            wallet.total_equity = wallet.balance + wallet.unrealized_pnl
            self._record_transaction(db, wallet, "SETTLEMENT", pnl, reason, trade_id)
            db.commit()
            return wallet.balance
        except Exception as e:
            db.rollback()
            logger.error(f"Trade settlement failed: {e}")
            raise
        finally:
            db.close()

    def update_unrealized_pnl(self, unrealized_pnl):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            wallet.unrealized_pnl = float(unrealized_pnl or 0.0)
            wallet.total_equity = wallet.balance + wallet.unrealized_pnl
            db.commit()
            return wallet.total_equity
        except Exception as e:
            db.rollback()
            logger.error(f"Wallet unrealized PnL update failed: {e}")
            raise
        finally:
            db.close()

    def get_status(self):
        db = self.get_session()
        try:
            wallet = self.get_wallet(db)
            return {
                "balance": wallet.balance,
                "available_balance": wallet.available_balance,
                "used_margin": wallet.used_margin,
                "unrealized_pnl": wallet.unrealized_pnl,
                "realized_pnl": wallet.realized_pnl,
                "total_equity": wallet.total_equity,
                "currency": wallet.currency,
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
                    "reason": t.reason,
                }
                for t in transactions
            ]
        finally:
            db.close()

    def reset_wallet(self):
        db = self.get_session()
        try:
            db.query(Transaction).delete()
            db.query(WalletTransaction).delete()
            wallet = self.get_wallet(db)
            wallet.balance = 0.0
            wallet.available_balance = 0.0
            wallet.used_margin = 0.0
            wallet.unrealized_pnl = 0.0
            wallet.realized_pnl = 0.0
            wallet.total_equity = 0.0
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error resetting wallet: {e}")
            return False
        finally:
            db.close()


wallet_manager = WalletManager()
