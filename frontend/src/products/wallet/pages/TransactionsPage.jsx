import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TransactionRow from '../../../components/wallet/TransactionRow';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const url = `/api/wallet/transactions?limit=100&type=${filter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [filter]);

  return (
    <div className="w-full text-slate-50">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Transaction History</h2>
          <div style={{ color: '#94a3b8' }}>Comprehensive log of all ledger adjustments and margin allocations.</div>
        </div>
        
        <div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Transactions</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="MARGIN_BLOCK">Margin Blocks</option>
            <option value="SETTLEMENT">Settlements</option>
          </select>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {loading ? (
          <div className="text-gray-400 text-center p-8">Loading history...</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-400 text-center p-8">No transactions found for this filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 0' }}>Date & Time</th>
                  <th style={{ padding: '12px 0' }}>Type</th>
                  <th style={{ padding: '12px 0' }}>Description</th>
                  <th style={{ padding: '12px 0', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 0', textAlign: 'right' }}>Total Balance After</th>
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

export default TransactionsPage;
