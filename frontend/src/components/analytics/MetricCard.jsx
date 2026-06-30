import React from 'react';

const MetricCard = ({ label, value, subValue, valueClass = '' }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>{label}</span>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }} className={valueClass}>
        {value}
      </div>
      {subValue && <div style={{ color: '#64748b', fontSize: '12px' }}>{subValue}</div>}
    </div>
  );
};

export default MetricCard;
