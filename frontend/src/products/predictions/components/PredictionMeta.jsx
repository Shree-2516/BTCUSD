import React from 'react';

const PredictionMeta = ({ data }) => {
  const trend = data?.trend || 'HOLD';
  const volForecast = data?.volatility_forecast || '--%';
  const whaleActivity = data?.whale_activity || 'Stable';
  const maCross = data?.indicators?.["MA Cross"] || '--';
  const volState = data?.indicators?.["Volatility"] || '--';
  const momentum = data?.indicators?.["Momentum"] || '--';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 2 }}>
      <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '24px' }}>
        <div className="meta-item" style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Next Trend</label>
          <span style={{ fontWeight: 'bold', color: trend === 'BUY' || trend === 'BULLISH' ? '#22c55e' : trend === 'SELL' || trend === 'BEARISH' ? '#ef4444' : '#f59e0b' }}>{trend}</span>
        </div>
        <div className="meta-item" style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Volatility Forecast</label>
          <span style={{ fontWeight: 'bold' }}>{volForecast}</span>
        </div>
        <div className="meta-item" style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Whale Activity</label>
          <span style={{ fontWeight: 'bold' }}>{whaleActivity}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card glass" style={{ padding: '16px', textAlign: 'center' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>MA Cross</label>
          <span style={{ fontWeight: 'bold', color: maCross === 'BULLISH' ? '#22c55e' : maCross === 'BEARISH' ? '#ef4444' : '#fff' }}>{maCross}</span>
        </div>
        <div className="card glass" style={{ padding: '16px', textAlign: 'center' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Volatility</label>
          <span style={{ fontWeight: 'bold', color: volState === 'STABLE' ? '#22c55e' : volState === 'UNSTABLE' ? '#ef4444' : '#fff' }}>{volState}</span>
        </div>
        <div className="card glass" style={{ padding: '16px', textAlign: 'center' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Momentum</label>
          <span style={{ fontWeight: 'bold', color: momentum === 'POSITIVE' ? '#22c55e' : momentum === 'NEGATIVE' ? '#ef4444' : '#fff' }}>{momentum}</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionMeta;
