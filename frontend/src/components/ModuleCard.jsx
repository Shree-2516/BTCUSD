import React from 'react';
import { useNavigate } from 'react-router-dom';

const ModuleCard = ({ module }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => module.enabled && navigate(module.route)}
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '24px',
        cursor: module.enabled ? 'pointer' : 'not-allowed',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        opacity: module.enabled ? 1 : 0.6,
      }}
      onMouseEnter={(e) => {
        if(module.enabled) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
          e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if(module.enabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          {module.icon}
        </div>
        
        {!module.enabled ? (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            LOCKED
          </span>
        ) : (
          <div style={{ color: '#3b82f6', opacity: 0.8, fontSize: '18px' }}>
            →
          </div>
        )}
      </div>

      <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>
        {module.title}
      </h3>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', flexGrow: 1 }}>
        {module.description}
      </p>
    </div>
  );
};

export default ModuleCard;
