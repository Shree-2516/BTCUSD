import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { sidebarRegistry } from '../core/plugins/SidebarRegistry';

const ProductSidebar = () => {
  const location = useLocation();
  const modules = sidebarRegistry.getSidebarModules(location.pathname);

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ 
        marginBottom: '16px', 
        paddingLeft: '8px', 
        color: '#94a3b8', 
        fontSize: '12px', 
        fontWeight: 'bold', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em' 
      }}>
        Modules
      </div>
      {modules.map((mod) => {
        const isActive = location.pathname === mod.route;
        return (
          <Link
            key={mod.id}
            to={mod.enabled ? mod.route : '#'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#fff' : '#cbd5e1',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              opacity: mod.enabled ? 1 : 0.5,
              cursor: mod.enabled ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (mod.enabled && !isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (mod.enabled && !isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>{mod.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '400' }}>{mod.title}</span>
            {!mod.enabled && (
              <span style={{ marginLeft: 'auto', fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>🔒</span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default ProductSidebar;
