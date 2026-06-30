import React from 'react';

const ForecastRange = ({ range = [0, 0], confidence = 'High', timeframe = 'Next 4h' }) => {
  return (
    <div className="card glass">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Predicted Trading Range ({timeframe})</h3>
        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>AI Forecast</span>
      </div>
      <div className="range-display" style={{ marginTop: '16px' }}>
        <div className="range-bar" style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ position: 'absolute', left: 0, top: '-24px', fontSize: '14px', fontWeight: 'bold' }}>
            ${range?.[0]?.toLocaleString(undefined, {maximumFractionDigits:0}) || '0'}
          </span>
          <div className="range-progress" style={{ position: 'absolute', left: '10%', right: '10%', height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--success))', borderRadius: '4px' }}></div>
          <span style={{ position: 'absolute', right: 0, top: '-24px', fontSize: '14px', fontWeight: 'bold' }}>
            ${range?.[1]?.toLocaleString(undefined, {maximumFractionDigits:0}) || '0'}
          </span>
        </div>
        <p className="range-meta" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '24px' }}>
          Confidence: <span style={{ color: '#fff', fontWeight: 'bold' }}>{confidence}</span> • Based on AI Model
        </p>
      </div>
    </div>
  );
};

export default ForecastRange;
