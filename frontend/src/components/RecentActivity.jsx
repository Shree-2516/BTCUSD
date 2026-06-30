import React from 'react';

const RecentActivity = ({ activities }) => {
  return (
    <div style={{ 
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#f8fafc', fontWeight: '600' }}>
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No recent activity to display.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activities.map((activity, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                {activity.icon || '📝'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '14px' }}>{activity.text}</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
