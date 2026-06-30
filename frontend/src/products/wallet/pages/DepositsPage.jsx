import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DepositsPage = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Manual Deposit');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return toast.error('Enter a valid deposit amount');
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), reason })
      });
      
      if (res.ok) {
        toast.success(`Successfully deposited $${amount}`);
        setAmount('');
        setReason('Manual Deposit');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to deposit funds');
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
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Virtual Deposits</h2>
        <div style={{ color: '#94a3b8' }}>Add mock capital to your paper trading account to test larger portfolios.</div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        maxWidth: '500px'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Deposit Amount (USDT)</label>
            <input 
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
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
              placeholder="e.g. Manual test injection"
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
            className="btn btn-primary"
            style={{ padding: '12px', fontSize: '16px', marginTop: '8px' }}
          >
            {loading ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositsPage;
