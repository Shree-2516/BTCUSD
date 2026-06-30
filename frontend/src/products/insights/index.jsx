import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import InsightsHome from './pages/InsightsHome';
import MarketRegimePage from './pages/MarketRegimePage';
import OrderFlowPage from './pages/OrderFlowPage';
import VolatilityPage from './pages/VolatilityPage';
import TechnicalInsightsPage from './pages/TechnicalInsightsPage';

const InsightsModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<InsightsHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="regime" element={<MarketRegimePage />} />
        <Route path="orderflow" element={<OrderFlowPage />} />
        <Route path="volatility" element={<VolatilityPage />} />
        <Route path="technical" element={<TechnicalInsightsPage />} />
      </Route>
    </Routes>
  );
};

export default InsightsModule;
