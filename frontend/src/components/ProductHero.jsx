import React from 'react';

const ProductHero = ({ title, subtitle, icon }) => {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)'
        }}>
          {icon}
        </div>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '40px', 
            fontWeight: '800', 
            color: '#f8fafc',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {title}
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '18px', maxWidth: '600px', lineHeight: '1.6' }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductHero;
