import React from 'react';

const FeatureImportancePage = () => {
  const features = [
    { name: "Rolling 24h Volatility", weight: 0.35, color: '#ef4444' },
    { name: "MA7 vs MA25 Diff", weight: 0.28, color: '#22c55e' },
    { name: "Close % Change", weight: 0.15, color: '#f59e0b' },
    { name: "Orderbook Imbalance", weight: 0.12, color: 'var(--accent-blue)' },
    { name: "Macro Sentiment", weight: 0.10, color: '#8b5cf6' }
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Feature Importance</h2>
      
      <div className="card glass" style={{ padding: '32px' }}>
        <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>LightGBM / RandomForest Drivers</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {features.map((f, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{f.name}</span>
                <span>{(f.weight * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: f.color, width: `${f.weight * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card glass" style={{ marginTop: '24px' }}>
        <h3>SHAP Values Context</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px', lineHeight: 1.6 }}>
          Feature importance indicates which data inputs currently have the highest predictive power for the AI model. 
          For example, if Volatility is high, the model is paying close attention to sudden price swings to determine the next trend direction.
        </p>
      </div>
    </div>
  );
};

export default FeatureImportancePage;
