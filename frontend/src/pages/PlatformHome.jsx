import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import PlatformNavbar from '../components/PlatformNavbar';
import { productRegistry } from '../core/plugins/ProductRegistry';
import { useDashboardStore } from '../store/dashboardStore';
import { useWebSocket } from '../hooks/useWebSocket';

const PlatformHome = () => {
  const products = productRegistry.getProducts();
  const { currentPrice, insightsData, fetchInsights } = useDashboardStore();
  const [latestNews, setLatestNews] = useState(null);
  
  // Localized Activity Log
  const [activityLog, setActivityLog] = useState([
    { id: 1, action: "Viewed Market Regime Insights", time: "2 mins ago", route: "/products/insights/regime" },
    { id: 2, action: "Checked Wallet Balance", time: "15 mins ago", route: "/products/wallet/balance" },
    { id: 3, action: "Ran AI Prediction on BTCUSD", time: "1 hour ago", route: "/products/predictions/daily" }
  ]);

  useEffect(() => {
    fetchInsights();
    
    // Fetch latest news headline for ticker
    fetch('/api/news/latest?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setLatestNews(data[0]);
        }
      })
      .catch(err => console.error("News fetch error", err));
  }, [fetchInsights]);

  // Hook for live price data
  useWebSocket();

  // Format Price
  const lastPrice = Number(currentPrice?.mark_price || currentPrice?.close || 0);
  const formattedPrice = lastPrice > 0 
    ? `$${lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
    : 'Loading...';
  
  const changePct = Number(currentPrice?.mark_change_24h || 0);
  const sign = changePct >= 0 ? '+' : '';
  const changeColor = changePct >= 0 ? '#10b981' : '#ef4444';

  const fngValue = insightsData?.fng?.value || 50;
  const fngLabel = insightsData?.fng?.label || 'Neutral';

  // Pinned products (for demo personalization)
  const [pinnedRoutes, setPinnedRoutes] = useState(() => {
    const saved = localStorage.getItem('pinned_workspaces');
    return saved ? JSON.parse(saved) : [];
  });

  const togglePin = (route) => {
    setPinnedRoutes(prev => {
      let newPinned;
      if (prev.includes(route)) {
        newPinned = prev.filter(r => r !== route);
      } else {
        if (prev.length >= 2) return prev; // max 2
        newPinned = [...prev, route];
      }
      localStorage.setItem('pinned_workspaces', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const pinnedProducts = products.filter(p => pinnedRoutes.includes(p.route));

  return (
    <div style={{ height: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <PlatformNavbar />
      
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
        <div style={{
          padding: '24px 32px',
          maxWidth: '1440px',
          margin: '0 auto',
          color: 'var(--text-primary)',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          
          {/* Row 1: Real-Time Market Ticker Ribbon */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <div className="card glass" style={{ padding: '16px 24px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>BTC/USD Live</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formattedPrice}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>24h Change</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: changeColor }}>
                  {sign}{changePct.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="card glass" style={{ padding: '16px 24px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Market Sentiment</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: fngValue > 50 ? '#10b981' : '#ef4444' }}>
                  {fngValue} | {fngLabel}
                </div>
              </div>
            </div>

            <div className="card glass" style={{ flex: 1, padding: '16px 24px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', marginRight: '12px', padding: '4px 8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }}>LATEST NEWS</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {latestNews ? latestNews.title : 'Scanning global intelligence feeds for breaking market updates...'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Personalization Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '48px' }}>
            {/* Favorites & Pinned */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Pinned Workspaces</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pinnedProducts.map((p, i) => (
                  <Link key={i} to={p.route} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'background 0.2s' }}
                         onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}>
                      <div style={{ fontSize: '24px' }}>📌</div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.description}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Recent Activity</h2>
              <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', minHeight: '235px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activityLog.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                      <div style={{ flex: 1 }}>
                        <Link to={log.route} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
                              onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}>
                          {log.action}
                        </Link>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{log.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--glass-border)', marginBottom: '32px' }} />

          {/* Row 3: Product Navigation Directory */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Platform Modules</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Access your complete suite of institutional trading applications. (Max 2 pins)</p>
          </div>
          
          <ProductGrid products={products} pinnedRoutes={pinnedRoutes} togglePin={togglePin} />
          
        </div>
      </div>
    </div>
  );
};

export default PlatformHome;
