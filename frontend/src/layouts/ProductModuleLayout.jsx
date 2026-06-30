import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import PlatformNavbar from '../components/PlatformNavbar';
import ProductSidebar from '../components/ProductSidebar';
import { navigationRegistry } from '../core/plugins/NavigationRegistry';

const ProductModuleLayout = () => {
  const location = useLocation();
  const breadcrumb = navigationRegistry.getBreadcrumbInfo(location.pathname);

  return (
    <div style={{ height: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <PlatformNavbar />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Product Sidebar */}
        <ProductSidebar />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* Breadcrumb Area */}
          <div style={{ 
            backgroundColor: '#1e293b', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <Link to="/platform" style={{ color: '#3b82f6', textDecoration: 'none' }}>Platform Home</Link>
            {breadcrumb && (
              <>
                <span>/</span>
                <Link to={breadcrumb.productRoute} style={{ color: '#3b82f6', textDecoration: 'none' }}>{breadcrumb.productName}</Link>
                {breadcrumb.moduleTitle && (
                  <>
                    <span>/</span>
                    <span style={{ color: '#cbd5e1' }}>{breadcrumb.moduleTitle}</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default ProductModuleLayout;
