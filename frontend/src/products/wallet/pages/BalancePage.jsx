import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MetricCard = ({ label, value, valueColor = '#f8fafc' }) => (
  <div style={{
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  }}>
    <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: 'bold', color: valueColor }}>{value}</div>
  </div>
);

const BalancePage = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/wallet');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setWallet(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load wallet balance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWallet();
    const interval = setInterval(fetchWallet, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-gray-400 p-8 text-center">Loading virtual wallet...</div>;
  }

  if (!wallet) return null;

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Virtual Wallet Overview</h2>
        <div style={{ color: '#94a3b8' }}>Real-time paper trading capital metrics and margin exposure.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <MetricCard 
          label="Total Balance (Settled)" 
          value={`$${parseFloat(wallet.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`} 
        />
        <MetricCard 
          label="Total Equity (incl. Unrealized)" 
          value={`$${parseFloat(wallet.total_equity || wallet.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`} 
          valueColor="#60a5fa"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <MetricCard 
          label="Available to Trade" 
          value={`$${parseFloat(wallet.available_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`} 
          valueColor="#10b981"
        />
        <MetricCard 
          label="Used Margin (Locked)" 
          value={`$${parseFloat(wallet.used_margin || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`} 
          valueColor="#f59e0b"
        />
        <MetricCard 
          label="Unrealized PnL" 
          value={`$${parseFloat(wallet.unrealized_pnl || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`} 
          valueColor={wallet.unrealized_pnl >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>
    </div>
  );
};

export default BalancePage;
