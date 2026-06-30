import { useEffect, useRef, useState, useCallback } from 'react';
import { useDashboardStore } from '../store/dashboardStore.js';
import { useTradeStore } from '../store/tradeStore.js';
import { useWalletStore } from '../store/walletStore.js';
import { useNewsStore } from '../store/newsStore.js';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    // Connect using current host to work with Vite proxy and production alike
    const isDev = window.location.port === '5173';
    const wsHost = isDev ? 'localhost:8000' : window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${wsHost}/ws/live`;
    
    console.log('Connecting to WebSocket...', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setIsReconnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'ticker' || payload.data) {
          // BTC price streaming
          useDashboardStore.setState({ currentPrice: payload.data });
          
          // Trade updates
          if (payload.active_trades) {
            useTradeStore.setState({ activeTrades: payload.active_trades });
          }
          if (payload.event) {
            // Log or handle trade events if needed
            useTradeStore.setState((state) => ({
               lastEvent: payload.event
            }));
          }

          // Portfolio updates
          if (payload.wallet) {
             useWalletStore.setState({ walletStatus: payload.wallet });
          }

          // Live testing status
          if (payload.live_state) {
            useDashboardStore.setState({ liveState: payload.live_state, liveStatus: payload.live_status });
          }
        } else if (payload.type === 'news') {
          // News alerts (if backend ever sends them)
          useNewsStore.setState((state) => ({
             newsAlerts: [...(state.newsAlerts || []), payload.data]
          }));
        }

      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      
      // Auto reconnect after 3 seconds
      setIsReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      // Let onclose handle the reconnection
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { isConnected, isReconnecting };
};
