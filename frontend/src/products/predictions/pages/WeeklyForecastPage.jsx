import React, { useState, useEffect } from 'react';
import AIGauge from '../components/AIGauge';
import ForecastRange from '../components/ForecastRange';

const WeeklyForecastPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await fetch('/ai/advanced-prediction');
        if (res.ok) {
          const adv = await res.json();
          setData(adv.next_week || {});
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
  if (!data || Object.keys(data).length === 0) return <div style={{ padding: '32px', color: '#9ca3af' }}>Weekly prediction not available right now.</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Weekly Forecast (7 Days)</h2>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <AIGauge confidence={data.confidence || 0} trend={data.prediction || 'HOLD'} title="WEEKLY SIGNAL GAUGE" />
        <div className="card glass" style={{ flex: 2, padding: '24px' }}>
          <h3>Multi-Step Target Lookahead</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
            The weekly model anticipates a {data.prediction?.toLowerCase()} structure over the next 7 days based on higher timeframe analysis and macro momentum flow.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <ForecastRange 
          range={data.range || [0, 0]} 
          confidence={`${data.confidence || 0}%`} 
          timeframe="Next 7 Days" 
        />
      </div>
    </div>
  );
};

export default WeeklyForecastPage;
