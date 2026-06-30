import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDashboardStore } from '../../../store/dashboardStore';

const OrderFlowPage = () => {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const { insightsData, isLoadingInsights, fetchInsights } = useDashboardStore();

  useEffect(() => {
    fetchInsights();
    
    // Connect to Delta Exchange WebSocket for L2 Orderbook
    const ws = new WebSocket('wss://socket.delta.exchange');

    ws.onopen = () => {
      setConnectionStatus('Connected (Live)');
      ws.send(JSON.stringify({
        type: 'subscribe',
        payload: {
          channels: [{ name: 'l2_orderbook', symbols: ['BTCUSD'] }]
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'l2_orderbook' && data.symbol === 'BTCUSD') {
          // Efficient state update
          if (data.buy) {
            setBids(prev => {
              const newBids = [...data.buy, ...prev].slice(0, 15);
              return newBids.sort((a, b) => Number(b.price) - Number(a.price));
            });
          }
          if (data.sell) {
            setAsks(prev => {
              const newAsks = [...data.sell, ...prev].slice(0, 15);
              return newAsks.sort((a, b) => Number(a.price) - Number(b.price));
            });
          }
        }
      } catch (err) {
        // Handle parsing errors silently
      }
    };

    ws.onerror = () => {
      setConnectionStatus('Connection Error');
    };

    ws.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    return () => {
      ws.close();
    };
  }, [fetchInsights]);

  // Memoize the volume profiles to prevent lag
  const maxBidVolume = useMemo(() => Math.max(...bids.map(b => Number(b.size) || 0), 1), [bids]);
  const maxAskVolume = useMemo(() => Math.max(...asks.map(a => Number(a.size) || 0), 1), [asks]);

  // Whale Alerts
  const whaleAlerts = insightsData?.whale_alerts || [];

  return (
    <div className="w-full text-slate-50" style={{ overflowY: 'auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Order Flow & Liquidity</h2>
          <div style={{ color: '#94a3b8' }}>Real-time L2 order book depth and on-chain whale tracking.</div>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: connectionStatus.includes('Connected') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: connectionStatus.includes('Connected') ? '#10b981' : '#ef4444', border: `1px solid ${connectionStatus.includes('Connected') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
          ● {connectionStatus}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Order Book Column */}
        <div className="card glass" style={{ flex: 2, padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '16px' }}>BTCUSD Order Book</h3>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Bids */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Size</span>
                <span>Bid Price</span>
              </div>
              {bids.length === 0 ? <div style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>Waiting for stream...</div> : bids.map((bid, i) => {
                const width = (Number(bid.size) / maxBidVolume) * 100;
                return (
                  <div key={`bid-${i}`} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: `${width}%`, backgroundColor: 'rgba(16, 185, 129, 0.1)', zIndex: 0 }}></div>
                    <span style={{ zIndex: 1, color: '#f8fafc' }}>{bid.size}</span>
                    <span style={{ zIndex: 1, color: '#10b981', fontWeight: 'bold' }}>{Number(bid.price).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Asks */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Ask Price</span>
                <span>Size</span>
              </div>
              {asks.length === 0 ? <div style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>Waiting for stream...</div> : asks.map((ask, i) => {
                const width = (Number(ask.size) / maxAskVolume) * 100;
                return (
                  <div key={`ask-${i}`} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${width}%`, backgroundColor: 'rgba(239, 68, 68, 0.1)', zIndex: 0 }}></div>
                    <span style={{ zIndex: 1, color: '#ef4444', fontWeight: 'bold' }}>{Number(ask.price).toFixed(2)}</span>
                    <span style={{ zIndex: 1, color: '#f8fafc' }}>{ask.size}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Whale Alerts Column */}
        <div className="card glass" style={{ flex: 1, padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '16px' }}>Whale Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoadingInsights ? (
              <div className="text-gray-400">Scanning blockchain...</div>
            ) : whaleAlerts.length > 0 ? (
              whaleAlerts.map((alert, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderLeft: `4px solid ${alert.impact === 'High' ? '#ef4444' : '#3b82f6'}` }}>
                  <div style={{ color: '#f8fafc', fontSize: '14px', marginBottom: '4px' }}>{alert.message}</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Impact: {alert.impact} • {alert.time}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No whale alerts found in recent blocks.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFlowPage;
