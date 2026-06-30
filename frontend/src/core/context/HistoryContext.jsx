import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HistoryContext = createContext({
  recentPages: [],
  moduleHistory: []
});

export const HistoryProvider = ({ children }) => {
  const location = useLocation();
  const [recentPages, setRecentPages] = useState([]);
  const [moduleHistory, setModuleHistory] = useState([]);

  useEffect(() => {
    // Track recent raw routes
    setRecentPages(prev => {
      const newHistory = [location.pathname, ...prev.filter(p => p !== location.pathname)];
      return newHistory.slice(0, 10); // Keep last 10
    });

    // Track specifically module routes (e.g. /products/trading/live)
    if (location.pathname.startsWith('/products/') && location.pathname.split('/').length >= 4) {
      setModuleHistory(prev => {
        const newHistory = [location.pathname, ...prev.filter(p => p !== location.pathname)];
        return newHistory.slice(0, 5); // Keep last 5 modules
      });
    }
  }, [location.pathname]);

  return (
    <HistoryContext.Provider value={{ recentPages, moduleHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistoryTracker = () => useContext(HistoryContext);
