import React from 'react';

const AIGauge = ({ confidence = 0, trend = 'HOLD', loading = false, title = "AI SIGNAL GAUGE" }) => {
  const dashOffset = 125.6 * (1 - (confidence / 100));
  const trendColor = trend === 'BUY' || trend === 'BULLISH' ? '#22c55e' : 
                     trend === 'SELL' || trend === 'BEARISH' ? '#ef4444' : '#f59e0b';

  return (
    <div className="card glass ai-status-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>{title}</h3>
      <div className="ai-gauge-container" style={{ position: 'relative', width: '150px', height: '100px' }}>
        <div className="ai-gauge">
          <svg viewBox="0 0 100 50" style={{ width: '100%', overflow: 'visible' }}>
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke={trendColor} 
              strokeWidth="8" 
              strokeDasharray="125.6" 
              strokeDashoffset={dashOffset} 
              strokeLinecap="round" 
              style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' }} 
            />
          </svg>
          <div className="ai-gauge-val" style={{ position: 'absolute', bottom: '0', width: '100%', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold' }}>{confidence.toFixed(1)}%</span>
            <label style={{ fontSize: '12px', color: trendColor, fontWeight: 'bold' }}>{loading ? 'ANALYZING' : trend}</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGauge;
