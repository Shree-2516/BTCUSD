import React, { useState, useEffect } from 'react';

const ConfidenceAnalysisPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/ai-insights');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const confidence = data?.confidence || 0;
  const level = confidence > 75 ? "High" : confidence > 45 ? "Medium" : "Low";
  const trend = data?.trend || "HOLD";

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Confidence Analysis</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="card glass" style={{ padding: '32px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Predict Proba Output</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginTop: '16px' }}>
            {confidence.toFixed(1)}%
          </div>
          <div className="badge" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)' }}>
            {level} Confidence
          </div>
        </div>

        <div className="card glass" style={{ padding: '32px' }}>
          <h3>Softmax Breakdown</h3>
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>BULLISH Probability</span>
              <span>{trend === "BUY" ? confidence.toFixed(1) : (100 - confidence).toFixed(1)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22c55e', width: `${trend === "BUY" ? confidence : (100 - confidence)}%` }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', marginTop: '24px' }}>
              <span>BEARISH Probability</span>
              <span>{trend === "SELL" ? confidence.toFixed(1) : (100 - confidence).toFixed(1)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#ef4444', width: `${trend === "SELL" ? confidence : (100 - confidence)}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceAnalysisPage;
