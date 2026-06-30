import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import NewsHome from './pages/NewsHome';
import NewsSentiment from '../../pages/NewsSentiment';
import SentimentAnalysisPage from './pages/SentimentAnalysisPage';
import MarketImpactPage from './pages/MarketImpactPage';
import AISummaryPage from './pages/AISummaryPage';

const NewsModule = () => {
  return (
    <Routes>
      {/* Product Home Dashboard */}
      <Route element={<ProductLayout />}>
        <Route index element={<NewsHome />} />
      </Route>
      
      {/* Nested Module Layout Routes */}
      <Route element={<ProductModuleLayout />}>
        <Route path="live" element={<NewsSentiment />} />
        <Route path="sentiment" element={<SentimentAnalysisPage />} />
        <Route path="impact" element={<MarketImpactPage />} />
        <Route path="summary" element={<AISummaryPage />} />
      </Route>
    </Routes>
  );
};

export default NewsModule;
