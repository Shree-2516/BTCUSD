import React, { useState, useEffect } from 'react';

const StrategiesPage = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await fetch('/api/strategies');
        if (res.ok) {
          const data = await res.json();
          setStrategies(data);
        }
      } catch (err) {
        console.error("Failed to fetch strategies", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
  }, []);

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Strategy Management</h2>
        <button className="btn btn-primary">Upload Strategy</button>
      </div>

      <div className="card glass">
        {loading ? (
          <p>Loading strategies...</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>File</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.name}</td>
                  <td style={{ padding: '12px', color: '#9ca3af' }}>{s.file}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge bg-success">Active</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>Configure</button>
                  </td>
                </tr>
              ))}
              {strategies.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>No strategies found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StrategiesPage;
