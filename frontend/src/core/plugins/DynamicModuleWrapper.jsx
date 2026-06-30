import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductLayout from '../../layouts/ProductLayout';
import ProductModuleLayout from '../../layouts/ProductModuleLayout';
import DynamicProductHome from '../../pages/DynamicProductHome';
import DynamicModulePage from '../../pages/DynamicModulePage';

const DynamicModuleWrapper = ({ product }) => {
  return (
    <Routes>
      <Route element={<ProductLayout />}>
        <Route index element={<DynamicProductHome />} />
      </Route>
      <Route element={<ProductModuleLayout />}>
        {(product.modules || []).map(mod => (
          <Route key={mod.id} path={mod.id} element={<DynamicModulePage />} />
        ))}
      </Route>
    </Routes>
  );
};

export default DynamicModuleWrapper;
