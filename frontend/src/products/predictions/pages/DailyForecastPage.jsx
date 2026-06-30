import React, { useState, useEffect } from 'react';
import AIGauge from '../components/AIGauge';
import ForecastRange from '../components/ForecastRange';
import PredictionMeta from '../components/PredictionMeta';

const DailyForecastPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const resInsights = await fetch('/api/ai-insights');
        if (resInsights.ok) {
          const insights = await resInsights.json();
          setData(insights);
        }
      } catch (err) {
        console.error("Error fetching AI data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAI();
    const interval = setInterval(fetchAI, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div style={{ padding: '32px', color: '#9ca3af' }}>Model calibrating...</div>;
  }

  const riskVal = data?.layers?.ai_sentiment?.risk_level || 'MEDIUM';
  const riskColors = { 'LOW': '#22c55e', 'MEDIUM': '#f59e0b', 'HIGH': '#ef4444', 'CRITICAL': '#7f1d1d' };

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Daily Forecast (24H)</h2>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <AIGauge confidence={data?.confidence} trend={data?.trend} loading={loading} />
        <PredictionMeta data={data} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <ForecastRange 
          range={[data?.predicted_range?.low, data?.predicted_range?.high]} 
          confidence="High" 
          timeframe="Next 24h" 
        />
        
        <div className="card glass">
          <h3>Historical Success Rate</h3>
          <div className="success-stats" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <div className="stat-circle" style={{ position: 'relative', width: '60px', height: '60px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <path strokeDasharray={`${data?.accuracy_48h || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="4" />
              </svg>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '14px', fontWeight: 'bold' }}>
                {data?.accuracy_48h || 0}%
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Historical Accuracy over 48h based on closed trades.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="card glass">
          <h3>AI Trade Thesis</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '10px' }}>
            {data?.layers?.ai_sentiment?.trade_thesis || data?.layers?.ai_sentiment?.reasoning || "Analysis complete. Waiting for new signals."}
          </p>
        </div>
        <div className="card glass">
          <h3>Risk & Context</h3>
          <div className="risk-meta" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text-secondary)' }}>Risk Level</label>
              <span className="badge" style={{ background: riskColors[riskVal] || '#f59e0b', color: 'white' }}>{riskVal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text-secondary)' }}>Market Context</label>
              <span style={{ fontWeight: 600 }}>{data?.layers?.ai_sentiment?.market_context || 'Stable'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyForecastPage;
