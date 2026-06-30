import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, isPinned, togglePin }) => {
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'trading': return '📈';
      case 'ai': return '🤖';
      case 'analytics': return '📊';
      case 'reports': return '📑';
      case 'news': return '📰';
      case 'wallet': return '💼';
      case 'insights': return '💡';
      case 'backtest': return '⏳';
      default: return '✨';
    }
  };

  const isAvailable = product.enabled && !product.comingSoon;

  const handleClick = () => {
    if (isAvailable && product.route) {
      navigate(product.route);
    }
  };

  return (
    <div 
      className={`product-card ${!isAvailable ? 'disabled' : ''}`}
      onClick={handleClick}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '20px',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        border: '1px solid var(--glass-border)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={(e) => {
        if(isAvailable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = 'var(--accent-glow)';
        }
      }}
      onMouseLeave={(e) => {
        if(isAvailable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginRight: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          {getIcon(product.icon)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.025em' }}>
              {product.name}
            </h3>
            {product.badge && (
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {product.badge}
              </span>
            )}
          </div>
          <div style={{ marginTop: '6px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              {product.category}
            </span>
          </div>
        </div>
      </div>
      
      <p style={{ 
        margin: 0, 
        color: 'var(--text-secondary)', 
        fontSize: '14px', 
        lineHeight: '1.6', 
        flexGrow: 1,
        letterSpacing: '0.01em'
      }}>
        {product.description}
      </p>
      
      {product.comingSoon && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-secondary)',
          fontSize: '11px',
          fontWeight: '600',
          padding: '4px 10px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--glass-border)'
        }}>
          Coming Soon
        </div>
      )}

      {/* Pin Icon */}
      {togglePin && isAvailable && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            togglePin(product.route);
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: product.comingSoon ? '120px' : '16px', // adjust if coming soon is there, though coming soon is not available
            fontSize: '20px',
            cursor: 'pointer',
            opacity: isPinned ? 1 : 0.4,
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = isPinned ? 1 : 0.4}
          title={isPinned ? "Unpin Workspace" : "Pin Workspace"}
        >
          {isPinned ? '📌' : '📍'}
        </div>
      )}
    </div>
  );
};

export default ProductCard;
