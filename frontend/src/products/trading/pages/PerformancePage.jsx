import React from 'react';

const PerformancePage = () => {
  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Performance Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card glass">
          <h3 style={{ marginBottom: '16px' }}>Equity Curve</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#9ca3af' }}>Chart Placeholder</span>
          </div>
        </div>
        <div className="card glass">
          <h3 style={{ marginBottom: '16px' }}>Drawdown</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#9ca3af' }}>Chart Placeholder</span>
          </div>
        </div>
      </div>

      <div className="card glass">
        <h3 style={{ marginBottom: '16px' }}>Key Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Win Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>--%</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Profit Factor</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>--</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Sharpe Ratio</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>--</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Max Drawdown</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>--%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
