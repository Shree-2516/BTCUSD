import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import ReportsHome from './pages/ReportsHome';
import Reports from '../../pages/Reports';
import LiveReportsPage from './pages/LiveReportsPage';
import ExportCenterPage from './pages/ExportCenterPage';
import PortfolioReportsPage from './pages/PortfolioReportsPage';

const ReportsModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<ReportsHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="backtest" element={<Reports />} />
        <Route path="live" element={<LiveReportsPage />} />
        <Route path="export" element={<ExportCenterPage />} />
        <Route path="portfolio" element={<PortfolioReportsPage />} />
      </Route>
    </Routes>
  );
};

export default ReportsModule;
