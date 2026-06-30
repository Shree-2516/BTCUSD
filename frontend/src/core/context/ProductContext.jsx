import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { productRegistry } from '../plugins/ProductRegistry';

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const location = useLocation();
  
  const currentProduct = useMemo(() => {
    return productRegistry.getProductByRoute(location.pathname);
  }, [location.pathname]);

  return (
    <ProductContext.Provider value={currentProduct}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => useContext(ProductContext);
