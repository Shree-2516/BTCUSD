import React, { useState, useEffect } from 'react';

const RegimeDetectionPage = () => {
  const [context, setContext] = useState(null);

  useEffect(() => {
    // We can fetch from /api/ai-insights to get market_context
    const fetchRegime = async () => {
      try {
        const res = await fetch('/api/ai-insights');
        if (res.ok) {
          const data = await res.json();
          setContext(data?.layers?.ai_sentiment?.market_context || "Stable / Neutral");
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRegime();
  }, []);

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Regime Detection</h2>
      
      <div className="card glass" style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Current Market Context</h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '16px', color: 'var(--accent-blue)' }}>
          {context ? context : "Calibrating Model..."}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginTop: '24px' }}>
        <div className="card glass">
          <h3>Regime Engine Rules</h3>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', marginTop: '16px', lineHeight: 1.6 }}>
            <li>Analyzes moving average crossovers (MA7 vs MA25).</li>
            <li>Tracks rolling 24h volatility against historical standard deviations.</li>
            <li>Classifies into: High Volatility Trending, Low Volatility Mean Reverting, etc.</li>
          </ul>
        </div>
        <div className="card glass">
          <h3>Model Clustering Map</h3>
          <div style={{ height: '150px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#9ca3af' }}>GMM Clustering Visualization Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegimeDetectionPage;
