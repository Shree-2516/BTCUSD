import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useProduct } from './ProductContext';

const ModuleContext = createContext(null);

export const ModuleProvider = ({ children }) => {
  const location = useLocation();
  const product = useProduct();
  
  const currentModule = useMemo(() => {
    if (!product || !product.modules) return null;
    return product.modules.find(m => m.route === location.pathname);
  }, [location.pathname, product]);

  return (
    <ModuleContext.Provider value={currentModule}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModule = () => useContext(ModuleContext);
