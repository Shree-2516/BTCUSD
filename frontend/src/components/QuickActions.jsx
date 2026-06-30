import React from 'react';

const QuickActions = ({ actions }) => {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', fontWeight: 'bold' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {actions.map((action, index) => (
          <button 
            key={index}
            onClick={action.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: action.primary ? '#3b82f6' : 'rgba(30, 41, 59, 0.8)',
              color: action.primary ? '#ffffff' : '#f8fafc',
              border: '1px solid',
              borderColor: action.primary ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: action.primary ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              if (!action.primary) e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (!action.primary) e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            }}
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
