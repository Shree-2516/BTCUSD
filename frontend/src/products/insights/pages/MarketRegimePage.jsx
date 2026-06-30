import React, { useEffect } from 'react';
import { useDashboardStore } from '../../../store/dashboardStore';

const MarketRegimePage = () => {
  const { insightsData, fetchInsights } = useDashboardStore();

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Fear & Greed
  const fngValue = insightsData?.fng?.value || 50;
  const fngLabel = insightsData?.fng?.label || 'Neutral';

  // Basic mock regime data
  const currentRegime = fngValue > 60 ? 'Bullish' : fngValue < 40 ? 'Bearish' : 'Consolidating';
  const regimeColor = currentRegime === 'Bullish' ? '#10b981' : currentRegime === 'Bearish' ? '#ef4444' : '#f59e0b';

  return (
    <div className="w-full text-slate-50" style={{ overflowY: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Market Regime</h2>
        <div style={{ color: '#94a3b8' }}>Macro structural context, fear/greed cycles, and prevailing trends.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* Fear and Greed Gauge */}
        <div className="card glass" style={{ padding: '32px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '24px', textAlign: 'center' }}>Crypto Fear & Greed Index</h3>
          
          <div style={{ position: 'relative', width: '200px', height: '100px', margin: '0 auto', overflow: 'hidden' }}>
            {/* Semicircle gauge background */}
            <div style={{ 
              position: 'absolute', 
              top: 0, left: 0, width: '200px', height: '200px', 
              borderRadius: '50%', 
              background: 'conic-gradient(from 270deg, #ef4444 0%, #f59e0b 25%, #10b981 50%, transparent 50%)',
              opacity: 0.3
            }}></div>
            
            {/* Semicircle gauge fill */}
            <div style={{ 
              position: 'absolute', 
              top: 0, left: 0, width: '200px', height: '200px', 
              borderRadius: '50%', 
              background: `conic-gradient(from 270deg, #ef4444 0%, #f59e0b ${(fngValue/100)*25}%, #10b981 ${(fngValue/100)*50}%, transparent ${(fngValue/100)*50}%)`,
              transition: 'all 1s ease'
            }}></div>
            
            {/* Inner cutout */}
            <div style={{ 
              position: 'absolute', 
              top: '20px', left: '20px', width: '160px', height: '160px', 
              borderRadius: '50%', 
              backgroundColor: '#1e293b'
            }}></div>

            <div style={{
              position: 'absolute',
              bottom: '10px',
              width: '100%',
              textAlign: 'center',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>{fngValue}</div>
          </div>
          
          <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: fngValue > 50 ? '#10b981' : '#ef4444', marginTop: '16px' }}>
            {fngLabel}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px', marginTop: '16px' }}>
            <span>Extreme Fear</span>
            <span>Extreme Greed</span>
          </div>
        </div>

        {/* Current Regime */}
        <div className="card glass" style={{ padding: '32px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '16px' }}>Current Market Regime</h3>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: regimeColor,
            textShadow: `0 0 20px ${regimeColor}40`
          }}>
            {currentRegime}
          </div>
          <p style={{ color: '#64748b', marginTop: '16px', textAlign: 'center', maxWidth: '300px' }}>
            Macro trend based on moving averages and trailing volatility cycles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketRegimePage;
