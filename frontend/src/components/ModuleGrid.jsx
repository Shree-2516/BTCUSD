import React from 'react';
import ModuleCard from './ModuleCard';

const ModuleGrid = ({ modules }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '24px',
      width: '100%'
    }}>
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </div>
  );
};

export default ModuleGrid;
