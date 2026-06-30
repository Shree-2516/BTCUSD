import React, { useState, useEffect } from 'react';
import SentimentBadge from '../../../components/news/SentimentBadge';

const MarketImpactPage = () => {
  const [impactEvents, setImpactEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpact();
  }, []);

  const fetchImpact = async () => {
    try {
      const res = await fetch('/api/news/impact');
      if (res.ok) {
        const data = await res.json();
        setImpactEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      color: '#f8fafc'
    }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 'bold' }}>
        Market Impact Analysis
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        Tracking high-confidence news events and subsequent BTC price volatility.
      </p>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading impact events...</div>
      ) : impactEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No high impact events recorded recently.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Event Time</th>
                <th style={{ padding: '12px 16px' }}>Headline</th>
                <th style={{ padding: '12px 16px' }}>Sentiment</th>
                <th style={{ padding: '12px 16px' }}>1H Change</th>
                <th style={{ padding: '12px 16px' }}>4H Change</th>
              </tr>
            </thead>
            <tbody>
              {impactEvents.map((ev, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>{new Date(ev.published_at).toLocaleString()}</td>
                  <td style={{ padding: '16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ev.title}>
                    {ev.title}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <SentimentBadge sentiment={ev.sentiment} confidence={ev.confidence} />
                  </td>
                  <td style={{ padding: '16px', color: ev.price_change_1h > 0 ? '#22c55e' : (ev.price_change_1h < 0 ? '#ef4444' : '#94a3b8') }}>
                    {ev.price_change_1h > 0 ? '+' : ''}{ev.price_change_1h}%
                  </td>
                  <td style={{ padding: '16px', color: ev.price_change_4h > 0 ? '#22c55e' : (ev.price_change_4h < 0 ? '#ef4444' : '#94a3b8') }}>
                    {ev.price_change_4h > 0 ? '+' : ''}{ev.price_change_4h}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarketImpactPage;

