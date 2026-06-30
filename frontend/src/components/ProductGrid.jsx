import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, pinnedRoutes = [], togglePin = null }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
      width: '100%'
    }}>
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          isPinned={pinnedRoutes.includes(product.route)}
          togglePin={togglePin}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
