import React from 'react';

const PerformanceStats = ({ stats, title = "Performance Summary" }) => {
  return (
    <section className="card glass" id="stats-card">
      <h3>{title}</h3>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div className="stat-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Net PnL</label>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {stats ? (typeof stats.pnl === 'number' ? stats.pnl.toFixed(2) : stats.pnl) : '--'}
          </span>
        </div>
        <div className="stat-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Win Rate</label>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {stats ? (typeof stats.winRate === 'number' ? `${stats.winRate.toFixed(2)}%` : stats.winRate) : '--'}
          </span>
        </div>
        <div className="stat-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Trades</label>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {stats ? stats.totalTrades : '--'}
          </span>
        </div>
        <div className="stat-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Max Drawdown</label>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {stats ? (typeof stats.drawdown === 'number' ? `${stats.drawdown.toFixed(2)}%` : stats.drawdown) : '--'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default PerformanceStats;
