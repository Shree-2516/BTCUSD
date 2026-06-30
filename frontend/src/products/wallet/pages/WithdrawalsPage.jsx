import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const WithdrawalsPage = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Manual Withdrawal');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    fetch('/api/wallet')
      .then(res => res.json())
      .then(data => setWallet(data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return toast.error('Enter a valid withdrawal amount');
    }
    
    if (wallet && parseFloat(amount) > wallet.available_balance) {
      return toast.error(`Amount exceeds Available to Trade ($${wallet.available_balance.toFixed(2)})`);
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), reason })
      });
      
      if (res.ok) {
        toast.success(`Successfully withdrew $${amount}`);
        setAmount('');
        setReason('Manual Withdrawal');
        // Refresh wallet
        const wRes = await fetch('/api/wallet');
        setWallet(await wRes.json());
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to withdraw funds');
      }
    } catch (err) {
      toast.error('Network error. Check backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Virtual Withdrawals</h2>
        <div style={{ color: '#94a3b8' }}>Remove mock capital from your account to test drawdowns. Cannot exceed available margin.</div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        maxWidth: '500px'
      }}>
        {wallet && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Available to Withdraw</div>
            <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
              ${parseFloat(wallet.available_balance).toLocaleString()}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Withdrawal Amount (USDT)</label>
            <input 
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '16px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Reason (Optional)</label>
            <input 
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Manual capital reduction"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '16px'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn"
            style={{ padding: '12px', fontSize: '16px', marginTop: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            {loading ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalsPage;
