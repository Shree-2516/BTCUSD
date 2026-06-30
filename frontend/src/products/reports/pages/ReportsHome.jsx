import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

import { useNavigate } from 'react-router-dom';

const ReportsHome = () => {
  const modules = productRegistry.getModules('reports');
  const navigate = useNavigate();

  const quickActions = [
    { label: 'Export Center', icon: '📥', primary: true, onClick: () => navigate('/products/reports/export') },
    { label: 'Portfolio Health', icon: '💼', onClick: () => navigate('/products/reports/portfolio') }
  ];

  const recentActivity = [
    { text: 'Monthly Portfolio Summary Generated', time: '1 day ago', icon: '📑' },
    { text: 'CSV Export: Trade History Completed', time: '2 days ago', icon: '📥' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="Reports Center" 
        subtitle="Automated reporting, backtest reviews, and extensive export capabilities."
        icon="📑"
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

export default ReportsHome;
