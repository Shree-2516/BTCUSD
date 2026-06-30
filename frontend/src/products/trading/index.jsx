import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import TradingHome from './pages/TradingHome';
import LiveTradingPage from './pages/LiveTradingPage';
import PaperTradingPage from './pages/PaperTradingPage';
import BacktestingPage from './pages/BacktestingPage';
import StrategiesPage from './pages/StrategiesPage';
import TradeHistoryPage from './pages/TradeHistoryPage';
import PerformancePage from './pages/PerformancePage';

const TradingModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<TradingHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="live" element={<LiveTradingPage />} />
        <Route path="paper" element={<PaperTradingPage />} />
        <Route path="backtest" element={<BacktestingPage />} />
        <Route path="strategies" element={<StrategiesPage />} />
        <Route path="history" element={<TradeHistoryPage />} />
        <Route path="performance" element={<PerformancePage />} />
      </Route>
    </Routes>
  );
};

export default TradingModule;
