import { productRegistry } from './ProductRegistry';

class NavigationRegistry {
  getNavbarProducts() {
    return productRegistry.getProducts().filter(p => p.enabled);
  }

  getBreadcrumbInfo(currentPath) {
    const product = productRegistry.getProductByRoute(currentPath);
    if (!product) return null;

    const module = product.modules?.find(m => m.route === currentPath);
    return {
      productName: product.name,
      productRoute: product.route,
      moduleTitle: module ? module.title : null
    };
  }
}

export const navigationRegistry = new NavigationRegistry();
