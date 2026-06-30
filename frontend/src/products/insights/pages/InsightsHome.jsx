import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

const InsightsHome = () => {
  const modules = productRegistry.getModules('insights');

  const quickActions = [
    { label: 'Technical Scanner', icon: '🔍', primary: true, onClick: () => {} },
    { label: 'Macro Indicators', icon: '🌍', onClick: () => {} }
  ];

  const recentActivity = [
    { text: 'Golden Cross detected on BTC/USD Daily', time: '5 hours ago', icon: '✨' },
    { text: 'Implied Volatility spike detected', time: '12 hours ago', icon: '⚡' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="Market Insights" 
        subtitle="Curated macroeconomic indicators, order flow tracking, and technical analysis."
        icon="💡"
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

export default InsightsHome;
