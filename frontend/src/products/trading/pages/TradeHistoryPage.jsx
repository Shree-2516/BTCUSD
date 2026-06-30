import React, { useState } from 'react';

const TradeHistoryPage = () => {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Trade History</h2>
      
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button 
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live Trades
        </button>
        <button 
          className={`tab-btn ${activeTab === 'paper' ? 'active' : ''}`}
          onClick={() => setActiveTab('paper')}
        >
          Paper Trades
        </button>
        <button 
          className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
          onClick={() => setActiveTab('backtest')}
        >
          Backtest Runs
        </button>
      </div>

      <div className="card glass">
        <p style={{ color: '#9ca3af' }}>Fetching {activeTab} trade data... (Implementation pending backend integration)</p>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '16px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Symbol</th>
              <th style={{ padding: '12px' }}>Side</th>
              <th style={{ padding: '12px' }}>Price</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>PnL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>No trades found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistoryPage;
