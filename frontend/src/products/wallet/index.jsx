import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import WalletHome from './pages/WalletHome';
import Wallet from '../../pages/Wallet';
import TransactionsPage from './pages/TransactionsPage';
import DepositsPage from './pages/DepositsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';

import PnLLedgerPage from './pages/PnLLedgerPage';
import BalancePage from './pages/BalancePage';

const WalletModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<WalletHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="balance" element={<BalancePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="deposits" element={<DepositsPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="ledger" element={<PnLLedgerPage />} />
      </Route>
    </Routes>
  );
};

export default WalletModule;
