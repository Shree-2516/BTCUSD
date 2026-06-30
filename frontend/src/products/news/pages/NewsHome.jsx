import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

const NewsHome = () => {
  const modules = productRegistry.getModules('news');

  const quickActions = [
    { label: 'Latest Headlines', icon: '📰', primary: true, onClick: () => {} },
    { label: 'Sentiment Trends', icon: '📈', onClick: () => {} }
  ];

  const recentActivity = [
    { text: 'Sentiment shifted to Bullish (+12%)', time: '30 mins ago', icon: '🚀' },
    { text: 'High Impact Event: CPI Data Released', time: '2 hours ago', icon: '💥' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="News Intelligence" 
        subtitle="Real-time market news, AI-driven sentiment analysis, and impact modeling."
        icon="📰"
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

export default NewsHome;
