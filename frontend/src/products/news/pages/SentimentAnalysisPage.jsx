import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SentimentAnalysisPage = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const res = await fetch('/api/news/sentiment-trends');
      if (res.ok) {
        const data = await res.json();
        // Format data for chart
        const formatted = data.map(d => ({
          time: new Date(d.created_at).toLocaleDateString() + ' ' + new Date(d.created_at).getHours() + ':00',
          score: d.signal === 'POSITIVE' ? d.confidence : (d.signal === 'NEGATIVE' ? -d.confidence : 0),
          positive: d.positive_news,
          negative: d.negative_news
        }));
        setTrends(formatted);
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
        Sentiment Trends (7 Days)
      </h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading sentiment trends...</div>
      ) : trends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No sentiment data available.</div>
      ) : (
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" name="Net Sentiment" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisPage;
