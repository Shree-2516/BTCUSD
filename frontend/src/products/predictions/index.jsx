import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import PredictionsHome from './pages/PredictionsHome';
import DailyForecastPage from './pages/DailyForecastPage';
import WeeklyForecastPage from './pages/WeeklyForecastPage';
import MonthlyForecastPage from './pages/MonthlyForecastPage';
import RegimeDetectionPage from './pages/RegimeDetectionPage';
import ConfidenceAnalysisPage from './pages/ConfidenceAnalysisPage';
import FeatureImportancePage from './pages/FeatureImportancePage';

const PredictionsModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<PredictionsHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="daily" element={<DailyForecastPage />} />
        <Route path="weekly" element={<WeeklyForecastPage />} />
        <Route path="monthly" element={<MonthlyForecastPage />} />
        <Route path="regime" element={<RegimeDetectionPage />} />
        <Route path="confidence" element={<ConfidenceAnalysisPage />} />
        <Route path="features" element={<FeatureImportancePage />} />
      </Route>
    </Routes>
  );
};

export default PredictionsModule;
