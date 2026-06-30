import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

const TradingHome = () => {
  const modules = productRegistry.getModules('trading');

  const quickActions = [
    { label: 'New Trade', icon: '⚡', primary: true, onClick: () => {} },
    { label: 'Create Strategy', icon: '🧩', onClick: () => {} }
  ];

  const recentActivity = [
    { text: 'Executed Market Buy: 0.5 BTC', time: '2 hours ago', icon: '🟢' },
    { text: 'Strategy "Alpha v2" backtest completed', time: '5 hours ago', icon: '✅' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="Trading Terminal" 
        subtitle="Advanced trading platform for research, paper trading, and strategy testing."
        icon="📈"
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

export default TradingHome;
