import React, { useEffect, useState, useMemo } from 'react';

const VolatilityPage = () => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch last 100 daily candles for volatility metrics
    fetch('/api/history?symbol=BTCUSD&resolution=1d&limit=100')
      .then(res => res.json())
      .then(data => {
        setCandles(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const metrics = useMemo(() => {
    if (!candles || candles.length < 14) return null;
    
    // Calculate ATR (14)
    let trSum = 0;
    for (let i = candles.length - 14; i < candles.length; i++) {
      const c = candles[i];
      const prevC = candles[i-1] || c;
      const hl = c.high - c.low;
      const hc = Math.abs(c.high - prevC.close);
      const lc = Math.abs(c.low - prevC.close);
      const tr = Math.max(hl, hc, lc);
      trSum += tr;
    }
    const atr14 = trSum / 14;

    // Daily variance over last 30 days
    const last30 = candles.slice(-30);
    const returns = [];
    for (let i = 1; i < last30.length; i++) {
      returns.push((last30[i].close - last30[i-1].close) / last30[i-1].close);
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    const currentPrice = candles[candles.length - 1].close;
    const atrPct = (atr14 / currentPrice) * 100;

    return {
      atr: atr14,
      atrPct,
      stdDev: stdDev * 100, // as percentage
    };
  }, [candles]);

  return (
    <div className="w-full text-slate-50" style={{ overflowY: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Volatility Metrics</h2>
        <div style={{ color: '#94a3b8' }}>Tracking parameter variance, average true range (ATR), and standard deviations.</div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading historical data...</div>
      ) : !metrics ? (
        <div className="text-gray-400">Not enough data to calculate metrics.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="card glass" style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Average True Range (ATR 14)</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>
              ${metrics.atr.toFixed(2)}
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Daily absolute price fluctuation</div>
          </div>

          <div className="card glass" style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>ATR Percentage</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
              {metrics.atrPct.toFixed(2)}%
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Relative to current price</div>
          </div>

          <div className="card glass" style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Standard Deviation (30d)</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
              ± {metrics.stdDev.toFixed(2)}%
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Daily return dispersion</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolatilityPage;
