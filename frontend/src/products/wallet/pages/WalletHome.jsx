import React from 'react';
import ProductHero from '../../../components/ProductHero';
import ModuleGrid from '../../../components/ModuleGrid';
import QuickActions from '../../../components/QuickActions';
import RecentActivity from '../../../components/RecentActivity';
import { productRegistry } from '../../../core/plugins/ProductRegistry';

const WalletHome = () => {
  const modules = productRegistry.getModules('wallet');

  const quickActions = [
    { label: 'Deposit Funds', icon: '⬇️', primary: true, onClick: () => {} },
    { label: 'Withdraw', icon: '⬆️', onClick: () => {} }
  ];

  const recentActivity = [
    { text: 'Received 0.1 BTC Deposit', time: '2 days ago', icon: '📥' },
    { text: 'Internal transfer to Margin Wallet', time: '3 days ago', icon: '🔄' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title="Wallet Center" 
        subtitle="Manage your portfolio, digital assets, and transaction history securely."
        icon="💼"
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

export default WalletHome;
