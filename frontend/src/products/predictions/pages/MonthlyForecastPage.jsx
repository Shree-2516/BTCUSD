import React, { useState, useEffect } from 'react';
import AIGauge from '../components/AIGauge';
import ForecastRange from '../components/ForecastRange';

const MonthlyForecastPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await fetch('/ai/advanced-prediction');
        if (res.ok) {
          const adv = await res.json();
          setData(adv.next_month || {});
        }
      } catch (err) {
        console.error("Error fetching AI data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAI();
  }, []);

  if (loading) return <div style={{ padding: '32px', color: '#9ca3af' }}>Model calibrating...</div>;
  if (!data || Object.keys(data).length === 0) return <div style={{ padding: '32px', color: '#9ca3af' }}>Monthly prediction not available right now.</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Monthly Forecast (30 Days)</h2>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <AIGauge confidence={data.confidence || 0} trend={data.prediction || 'HOLD'} title="MONTHLY SIGNAL GAUGE" />
        <div className="card glass" style={{ flex: 2, padding: '24px' }}>
          <h3>Structural Trend Lookahead</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
            The monthly model analyzes macroeconomic shifts, halving cycles, and long-term liquidity flows. Currently predicting a {data.prediction?.toLowerCase()} regime for the next 30 days.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <ForecastRange 
          range={data.range || [0, 0]} 
          confidence={`${data.confidence || 0}%`} 
          timeframe="Next 30 Days" 
        />
      </div>
    </div>
  );
};

export default MonthlyForecastPage;
