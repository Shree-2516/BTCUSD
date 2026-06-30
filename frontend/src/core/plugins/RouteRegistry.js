import { productRegistry } from './ProductRegistry';

class RouteRegistry {
  getDynamicProducts() {
    const legacyIds = ['trading', 'predictions', 'news', 'analytics', 'reports', 'wallet', 'insights'];
    return productRegistry.getProducts().filter(p => !legacyIds.includes(p.id));
  }
}

export const routeRegistry = new RouteRegistry();
