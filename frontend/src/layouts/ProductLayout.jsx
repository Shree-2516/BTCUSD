import React, { useMemo } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import PlatformNavbar from '../components/PlatformNavbar';
import { products } from '../config/products';

const ProductLayout = () => {
  const location = useLocation();

  // Find the product matching the current route
  const currentProduct = useMemo(() => {
    return products.find(p => p.route === location.pathname) || {
      name: 'Product',
      description: 'Product workspace',
      icon: '✨'
    };
  }, [location.pathname]);

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

  return (
    <div style={{ height: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <PlatformNavbar />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Product Header Area */}
        <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px 32px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              <Link to="/platform" style={{ color: '#3b82f6', textDecoration: 'none' }}>Platform Home</Link>
              <span>/</span>
              <span style={{ color: '#cbd5e1' }}>{currentProduct.name}</span>
            </div>

            {/* Product Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                {getIcon(currentProduct.icon)}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.025em' }}>
                  {currentProduct.name}
                </h1>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '16px' }}>
                  {currentProduct.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProductLayout;
