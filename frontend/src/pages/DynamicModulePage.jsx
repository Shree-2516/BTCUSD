import React from 'react';
import { useModule } from '../core/context/ModuleContext';

const DynamicModulePage = () => {
  const module = useModule();

  if (!module) {
    return <div style={{ color: '#f8fafc', padding: '32px' }}>Module not found</div>;
  }

  return (
    <div style={{
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      padding: '40px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      color: '#f8fafc',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{module.icon}</div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 'bold' }}>
        {module.title}
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '16px' }}>
        {module.description}
      </p>
      <div style={{ marginTop: '24px', padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'inline-block', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
        Auto-generated via Plugin Architecture
      </div>
    </div>
  );
};

export default DynamicModulePage;
