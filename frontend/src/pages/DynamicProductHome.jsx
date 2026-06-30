import React from 'react';
import ProductHero from '../components/ProductHero';
import ModuleGrid from '../components/ModuleGrid';
import { useProduct } from '../core/context/ProductContext';

const DynamicProductHome = () => {
  const product = useProduct();

  if (!product) {
    return <div style={{ color: '#f8fafc', padding: '32px' }}>Product not found</div>;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      <ProductHero 
        title={product.name} 
        subtitle={product.description}
        icon={product.icon}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '-0.02em' }}>Platform Modules</h2>
          <ModuleGrid modules={product.modules || []} />
        </div>
      </div>
    </div>
  );
};

export default DynamicProductHome;
