import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

const PredictionsHome = () => {
  const modules = productRegistry.getModules('predictions');

  const quickActions = [
    { label: 'View Today Forecast', icon: '📅', primary: true, onClick: () => {} },
    { label: 'Model Metrics', icon: '📊', onClick: () => {} }
  ];

  const recentActivity = [
    { text: 'Regime shifted from Trend to Mean Reversion', time: '1 hour ago', icon: '🔄' },
    { text: 'Weekly Forecast Updated', time: '12 hours ago', icon: '✅' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="AI Predictions" 
        subtitle="Machine learning models forecasting market movements and detecting regimes."
        icon="🤖"
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

export default PredictionsHome;
