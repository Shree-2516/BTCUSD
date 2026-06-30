import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TransactionRow from '../../../components/wallet/TransactionRow';

const PnLLedgerPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Aggregate stats
  const totalSettled = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const totalWins = transactions.filter(tx => tx.amount > 0).length;
  const totalLosses = transactions.filter(tx => tx.amount < 0).length;

  useEffect(() => {
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const url = `/api/wallet/transactions?limit=200&type=SETTLEMENT`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load PnL ledger');
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>PnL Ledger</h2>
        <div style={{ color: '#94a3b8' }}>Historical statement of performance-driven settlements.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Net Ledger PnL</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: totalSettled >= 0 ? '#10b981' : '#ef4444' }}>
            {totalSettled >= 0 ? '+' : ''}${parseFloat(totalSettled).toFixed(2)}
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Profitable Settlements</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{totalWins}</div>
        </div>
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Loss Settlements</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{totalLosses}</div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {loading ? (
          <div className="text-gray-400 text-center p-8">Loading PnL history...</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-400 text-center p-8">No settlements found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 0' }}>Date & Time</th>
                  <th style={{ padding: '12px 0' }}>Type</th>
                  <th style={{ padding: '12px 0' }}>Description</th>
                  <th style={{ padding: '12px 0', textAlign: 'right' }}>Realized Amount</th>
                  <th style={{ padding: '12px 0', textAlign: 'right' }}>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PnLLedgerPage;
