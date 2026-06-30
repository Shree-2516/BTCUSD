import React, { useState, useEffect } from 'react';

const StrategySelector = ({ selectedStrategy, onChange }) => {
  const [strategies, setStrategies] = useState([]);

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
      }
    };
    fetchStrategies();
  }, []);

  return (
    <div className="form-group">
      <label>Select Strategy</label>
      <select 
        value={selectedStrategy} 
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <option value="">Select a strategy...</option>
        {strategies.map(s => (
          <option key={s.name} value={s.name}>{s.name}</option>
        ))}
      </select>
    </div>
  );
};

export default StrategySelector;
