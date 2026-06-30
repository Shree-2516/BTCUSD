import React from 'react';
import { ProductProvider } from './ProductContext';
import { ModuleProvider } from './ModuleContext';
import { HistoryProvider } from './HistoryContext';

export const PluginProvider = ({ children }) => {
  // Plugin initialization could happen here if necessary (e.g. fetching remote plugins)
  
  return (
    <HistoryProvider>
      <ProductProvider>
        <ModuleProvider>
          {children}
        </ModuleProvider>
      </ProductProvider>
    </HistoryProvider>
  );
};
