import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

const AnalyticsHome = () => {
  const modules = productRegistry.getModules('analytics');

  const quickActions = [
    { label: 'View PnL', icon: '💰', primary: true, onClick: () => {} },
    { label: 'Risk Dashboard', icon: '⚠️', onClick: () => {} }
  ];

  const recentActivity = [
    { text: 'Daily Sharpe Ratio increased by 0.15', time: '4 hours ago', icon: '📈' },
    { text: 'Max Drawdown alert cleared', time: '1 day ago', icon: '✅' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="Analytics Studio" 
        subtitle="Deep dive into market data, portfolio performance, and risk metrics."
        icon="📊"
      />
      <QuickActions actions={quickActions} />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '32px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '-0.02em' }}>Platform Modules</h2>
          <ModuleGrid modules={modules} />
        </div>
        <div>
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHome;
