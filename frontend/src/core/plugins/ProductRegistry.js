import { products } from '../../config/products';

class ProductRegistry {
  constructor() {
    this.products = new Map();
    this.modules = new Map();
    this._initialize();
  }

  _initialize() {
    products.forEach(p => {
      this.registerProduct(p);
      if (p.modules) {
        p.modules.forEach(m => this.registerModule(p.id, m));
      }
    });
  }

  registerProduct(product) {
    this.products.set(product.id, product);
  }

  registerModule(productId, module) {
    const key = `${productId}:${module.id}`;
    this.modules.set(key, { ...module, productId });
  }

  getProducts() {
    return Array.from(this.products.values());
  }

  getProduct(id) {
    return this.products.get(id);
  }

  getProductByRoute(route) {
    return this.getProducts().find(p => p.route === route || route.startsWith(p.route));
  }

  getModules(productId) {
    const product = this.getProduct(productId);
    return product ? product.modules : [];
  }
}

export const productRegistry = new ProductRegistry();
