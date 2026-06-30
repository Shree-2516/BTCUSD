import React from 'react';

const ChartFrame = ({ title, children, height = '350px' }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h4 style={{ marginBottom: '16px', color: '#94a3b8', fontSize: '16px', fontWeight: 'bold' }}>{title}</h4>
      <div style={{ position: 'relative', height: height, width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default ChartFrame;
