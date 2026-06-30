import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

import DashboardLayout from './layouts/DashboardLayout';
import ProductLayout from './layouts/ProductLayout';
import { PluginProvider } from './core/context/PluginProvider';
import { ThemeProvider } from './core/context/ThemeContext';
import { routeRegistry } from './core/plugins/RouteRegistry';
import DynamicModuleWrapper from './core/plugins/DynamicModuleWrapper';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Insights = lazy(() => import('./pages/Insights'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AIPredictions = lazy(() => import('./pages/AIPredictions'));
const NewsSentiment = lazy(() => import('./pages/NewsSentiment'));
const PlatformHome = lazy(() => import('./pages/PlatformHome'));

// Product Modules
const TradingModule = lazy(() => import('./products/trading'));
const PredictionsModule = lazy(() => import('./products/predictions'));
const NewsModule = lazy(() => import('./products/news'));
const AnalyticsModule = lazy(() => import('./products/analytics'));
const ReportsModule = lazy(() => import('./products/reports'));
const WalletModule = lazy(() => import('./products/wallet'));
const InsightsModule = lazy(() => import('./products/insights'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <PluginProvider>
          <Suspense fallback={<div style={{ padding: '20px', color: '#9ca3af' }}>Loading application...</div>}>
            <Routes>
              <Route path="/" element={<PlatformHome />} />

              {/* Dashboard Layout Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* Legacy Routes Redirects */}
              <Route path="/insights" element={<Navigate to="/products/insights" replace />} />
              <Route path="/wallet" element={<Navigate to="/products/wallet" replace />} />
              <Route path="/reports" element={<Navigate to="/products/reports" replace />} />
              <Route path="/analytics" element={<Navigate to="/products/analytics" replace />} />
              <Route path="/ai-predictions" element={<Navigate to="/products/predictions" replace />} />
              <Route path="/news" element={<Navigate to="/products/news" replace />} />
              <Route path="/profile" element={<Navigate to="/" replace />} />
              <Route path="/settings" element={<Navigate to="/" replace />} />


              {/* Product Layout Routes */}
              <Route path="products/trading/*" element={<TradingModule />} />
              <Route path="products/predictions/*" element={<PredictionsModule />} />
              <Route path="products/news/*" element={<NewsModule />} />
              <Route path="products/analytics/*" element={<AnalyticsModule />} />
              <Route path="products/reports/*" element={<ReportsModule />} />
              <Route path="products/wallet/*" element={<WalletModule />} />
              <Route path="products/insights/*" element={<InsightsModule />} />
              
              {/* Dynamic Plugin Routes */}
              {routeRegistry.getDynamicProducts().map(product => {
                // remove leading slash for nesting inside Routes if needed, but App.jsx uses absolute-like relative paths e.g., "products/options"
                const cleanRoute = product.route.startsWith('/') ? product.route.slice(1) : product.route;
                return (
                  <Route key={product.id} path={`${cleanRoute}/*`} element={<DynamicModuleWrapper product={product} />} />
                );
              })}
            </Routes>
          </Suspense>
          </PluginProvider>
        </BrowserRouter>
      </ThemeProvider>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
