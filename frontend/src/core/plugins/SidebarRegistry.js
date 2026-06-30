import { productRegistry } from './ProductRegistry';

class SidebarRegistry {
  getSidebarModules(currentPath) {
    const product = productRegistry.getProductByRoute(currentPath);
    if (!product || !product.sidebar) return [];
    return product.modules || [];
  }
}

export const sidebarRegistry = new SidebarRegistry();
