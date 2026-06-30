import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { walletStatus, walletHistory, fetchWalletStatus, fetchWalletHistory, deposit, withdraw, reset } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchWalletStatus();
    fetchWalletHistory();
  }, [fetchWalletStatus, fetchWalletHistory]);

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount');
    await deposit(parseFloat(amount), note);
    toast.success('Deposit successful');
    setAmount('');
    setNote('');
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount');
    await withdraw(parseFloat(amount), note);
    toast.success('Withdrawal successful');
    setAmount('');
    setNote('');
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the wallet to initial state?')) {
      await reset();
      toast.success('Wallet reset successful');
    }
  };

  return (
    <div id="view-wallet" className="w-full">
      <div className="wallet-grid">
        <section className="card glass wallet-management">
          <h3>Virtual Wallet</h3>
          <div className="wallet-status-card">
            <div className="balance-display">
              <label>Total Balance</label>
              <div className="big-balance">
                <span id="wallet-page-balance">{walletStatus?.balance?.toFixed(2) || '0.00'}</span> <small>USDT</small>
              </div>
            </div>
            <div className="balance-display">
              <label>Available to Trade</label>
              <div className="big-balance" style={{ fontSize: '32px', marginTop: 0 }}>
                <span id="wallet-available-balance">{walletStatus?.available_balance?.toFixed(2) || '0.00'}</span> <small>USDT</small>
              </div>
            </div>
            <div className="wallet-live-metrics">
              <div><label>Used Margin</label><span id="wallet-used-margin">{walletStatus?.used_margin?.toFixed(2) || '0.00'}</span></div>
              <div><label>Total Equity</label><span id="wallet-total-equity">{walletStatus?.total_equity?.toFixed(2) || '0.00'}</span></div>
              <div>
                <label>Unrealized PnL</label>
                <span className={walletStatus?.unrealized_pnl >= 0 ? 'pnl-up' : 'pnl-down'}>
                  {walletStatus?.unrealized_pnl >= 0 ? '+' : ''}{walletStatus?.unrealized_pnl?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div>
                <label>Realized PnL</label>
                <span className={walletStatus?.realized_pnl >= 0 ? 'pnl-up' : 'pnl-down'}>
                  {walletStatus?.realized_pnl >= 0 ? '+' : ''}{walletStatus?.realized_pnl?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
            <div className="wallet-actions-grid">
              <div className="form-group">
                <label>Amount (USDT)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="input-large" 
                />
              </div>
              <div className="form-group">
                <label>Reference / Note</label>
                <input 
                  type="text" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Optional note..." 
                />
              </div>
              <div className="button-group">
                <button className="btn btn-primary" onClick={handleDeposit}>
                  <span className="icon"></span> Deposit Funds
                </button>
                <button className="btn btn-danger" onClick={handleWithdraw}>
                  <span className="icon"></span> Withdraw
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleReset}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', marginLeft: 'auto' }}
                >
                  <span className="icon"></span> Reset Wallet
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="card glass wallet-history">
          <h3>Transaction History</h3>
          <div className="table-container">
            <table id="wallet-history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {!walletHistory || walletHistory.length === 0 ? (
                  <tr><td colSpan="5">No transactions yet</td></tr>
                ) : (
                  walletHistory.map((tx, i) => (
                    <tr key={i}>
                      <td>{new Date(tx.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${tx.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td>{tx.amount.toFixed(2)}</td>
                      <td>{tx.balance_after.toFixed(2)}</td>
                      <td>{tx.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Wallet;
