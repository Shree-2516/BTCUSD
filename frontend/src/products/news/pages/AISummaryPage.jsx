import React, { useState, useEffect } from 'react';

const AISummaryPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/news/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          AI Executive Summary
        </h2>
        {summary?.created_at && (
          <span style={{ color: '#64748b', fontSize: '12px' }}>
            Generated: {new Date(summary.created_at).toLocaleString()}
          </span>
        )}
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Generating summary...</div>
      ) : !summary || !summary.topics || summary.topics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🤖</div>
          No recent summary available. The AI agent will compile one shortly.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {summary.topics.map((topic, i) => (
            <div key={i} style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.02)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }}>
                {topic.category}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.6' }}>
                {topic.bullets.map((bullet, j) => (
                  <li key={j} style={{ marginBottom: '12px' }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISummaryPage;

