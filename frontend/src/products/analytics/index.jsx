import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import AnalyticsHome from './pages/AnalyticsHome';
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage';
import RiskAnalyticsPage from './pages/RiskAnalyticsPage';
import PortfolioStatisticsPage from './pages/PortfolioStatisticsPage';
import EquityAnalyticsPage from './pages/EquityAnalyticsPage';
import DistributionPage from './pages/DistributionPage';
import DrawdownAnalysisPage from './pages/DrawdownAnalysisPage';

const AnalyticsModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<AnalyticsHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="performance" element={<PerformanceAnalyticsPage />} />
        <Route path="risk" element={<RiskAnalyticsPage />} />
        <Route path="portfolio" element={<PortfolioStatisticsPage />} />
        <Route path="equity" element={<EquityAnalyticsPage />} />
        <Route path="distribution" element={<DistributionPage />} />
        <Route path="drawdown" element={<DrawdownAnalysisPage />} />
      </Route>
    </Routes>
  );
};

export default AnalyticsModule;
