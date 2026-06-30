import { productRegistry } from './ProductRegistry';

class SearchRegistry {
  getSearchIndex() {
    const index = [];
    productRegistry.getProducts().forEach(p => {
      if (p.searchable) {
        index.push({
          id: p.id,
          type: 'product',
          title: p.name,
          description: p.description,
          route: p.route,
          icon: p.icon
        });
        if (p.modules) {
          p.modules.forEach(m => {
            if (m.enabled) {
              index.push({
                id: `${p.id}:${m.id}`,
                type: 'module',
                title: `${p.name} - ${m.title}`,
                description: m.description,
                route: m.route,
                icon: m.icon
              });
            }
          });
        }
      }
    });
    return index;
  }
}

export const searchRegistry = new SearchRegistry();
