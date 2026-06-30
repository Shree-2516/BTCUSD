import React, { useState, useEffect } from 'react';

const AIPredictions = () => {
  const [data, setData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const [resInsights, resAdvanced] = await Promise.all([
          fetch('/api/ai-insights'),
          fetch('/ai/advanced-prediction')
        ]);
        
        if (resInsights.ok) {
          const insights = await resInsights.json();
          setData(insights);
        }
        if (resAdvanced.ok) {
          const adv = await resAdvanced.json();
          setAdvancedData(adv);
        }
      } catch (err) {
        console.error("Error fetching AI data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAI();
    
    // Optional: Refresh every 60s
    const interval = setInterval(fetchAI, 60000);
    return () => clearInterval(interval);
  }, []);

  const confidence = data?.confidence || 0;
  const trend = data?.trend || 'HOLD';
  const dashOffset = 125.6 * (1 - (confidence / 100));
  const trendColor = trend === 'BUY' ? '#22c55e' : trend === 'SELL' ? '#ef4444' : '#f59e0b';
  
  const riskVal = data?.layers?.ai_sentiment?.risk_level || 'MEDIUM';
  const riskColors = { 'LOW': '#22c55e', 'MEDIUM': '#f59e0b', 'HIGH': '#ef4444', 'CRITICAL': '#7f1d1d' };

  return (
    <div className="w-full">
      <div className="ai-container" style={{ padding: '24px' }}>
        <div className="insights-header-row">
          <div className="card glass ai-status-card">
            <h3>AI SIGNAL GAUGE</h3>
            <div className="ai-gauge-container">
              <div className="ai-gauge">
                <svg viewBox="0 0 100 50">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={trendColor} strokeWidth="8" strokeDasharray="125.6" strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                </svg>
                <div className="ai-gauge-val">
                  <span>{confidence.toFixed(1)}%</span>
                  <label>{loading ? 'ANALYZING' : trend}</label>
                </div>
              </div>
            </div>
          </div>
          <div className="card glass prediction-meta">
            <div className="meta-item">
              <label>Next-Hour Trend</label>
              <span className={trend === 'BUY' ? 'pnl-up' : trend === 'SELL' ? 'pnl-down' : ''}>{trend}</span>
            </div>
            <div className="meta-item">
              <label>4h Volatility Forecast</label>
              <span>{data?.volatility_forecast || '--%'}</span>
            </div>
            <div className="meta-item">
              <label>Whale Activity</label>
              <span>{data?.whale_activity || 'Stable'}</span>
            </div>
          </div>
        </div>

        <div className="indicators-row" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="card glass" style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Trend Signal</label>
            <span className={data?.indicators?.["MA Cross"] === 'BULLISH' ? 'pnl-up' : 'pnl-down'} style={{ fontSize: '18px', fontWeight: 700 }}>{data?.indicators?.["MA Cross"] || '--'}</span>
          </div>
          <div className="card glass" style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Volatility State</label>
            <span className={data?.indicators?.["Volatility"] === 'STABLE' ? 'pnl-up' : 'pnl-down'} style={{ fontSize: '18px', fontWeight: 700 }}>{data?.indicators?.["Volatility"] || '--'}</span>
          </div>
          <div className="card glass" style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Momentum</label>
            <span className={data?.indicators?.["Momentum"] === 'POSITIVE' ? 'pnl-up' : 'pnl-down'} style={{ fontSize: '18px', fontWeight: 700 }}>{data?.indicators?.["Momentum"] || '--'}</span>
          </div>
        </div>

        <div className="insights-main-grid" style={{ marginTop: '24px' }}>
          <div className="card glass">
            <div className="section-header">
              <h3>Predicted Trading Range (Next 4h)</h3>
              <span className="badge">AI Forecast</span>
            </div>
            <div className="range-display">
              <div className="range-bar">
                <span>${data?.predicted_range?.low?.toLocaleString() || '0.00'}</span>
                <div className="range-progress" style={{ left: '10%', right: '10%' }}></div>
                <span>${data?.predicted_range?.high?.toLocaleString() || '0.00'}</span>
              </div>
              <p className="range-meta">Confidence: <span>High</span> • Based ML model</p>
            </div>
          </div>

          <div className="card glass">
            <h3>Historical Success Rate</h3>
            <div className="success-stats">
              <div className="stat-circle">
                <svg viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <path strokeDasharray={`${data?.accuracy_48h || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
                <span>{data?.accuracy_48h || 0}%</span>
              </div>
              <p>Historical Accuracy over 48h</p>
            </div>
          </div>
        </div>

        <div className="ai-intelligence-row" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card glass">
            <h3>AI Trade Thesis</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '10px' }}>
              {data?.layers?.ai_sentiment?.trade_thesis || data?.layers?.ai_sentiment?.reasoning || "Analysis complete."}
            </p>
          </div>
          <div className="card glass">
            <h3>Risk & Context</h3>
            <div className="risk-meta" style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Risk Level</label>
                <span className="badge" style={{ background: riskColors[riskVal] || '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{riskVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Market Context</label>
                <span style={{ fontWeight: 600 }}>{data?.layers?.ai_sentiment?.market_context || 'Stable'}</span>
              </div>
            </div>
          </div>
        </div>

        <h3 style={{ marginTop: '32px', marginBottom: '16px', fontFamily: 'Outfit' }}>ADVANCED FORECASTING</h3>
        <div className="ai-forecast-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          
          {['day', 'week', 'month'].map(period => {
            const adv = advancedData?.[`next_${period}`] || {};
            const prediction = adv.prediction || '--';
            const conf = adv.confidence || 0;
            const bgConf = prediction === 'BULLISH' ? 'var(--success)' : prediction === 'BEARISH' ? 'var(--danger)' : 'var(--accent)';
            const clsBadge = prediction === 'BULLISH' ? 'side-buy' : prediction === 'BEARISH' ? 'side-sell' : '';
            return (
              <div key={period} className="card glass forecast-card">
                <div className="forecast-header">
                  <h4 style={{textTransform: 'capitalize'}}>Next {period}</h4>
                  <span className={`badge ${clsBadge}`}>{prediction}</span>
                </div>
                <div className="forecast-conf">
                  <label>Confidence <span>{conf.toFixed(1)}%</span></label>
                  <div className="conf-bar"><div className="conf-fill" style={{ width: `${conf}%`, background: bgConf }}></div></div>
                </div>
                <div className="forecast-range">
                  <label>Expected Range</label>
                  <div className="range-vals">
                    <span>${adv.range?.[0]?.toLocaleString(undefined, {maximumFractionDigits:0}) || '--'}</span>
                    <span>-</span>
                    <span>${adv.range?.[1]?.toLocaleString(undefined, {maximumFractionDigits:0}) || '--'}</span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default AIPredictions;
