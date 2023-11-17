import { Order } from './order';
import { Product } from './product';
import { ProductVariant } from './product-variant';

export class OrderItem {
  id: string;
  order: Order;
  product?: Product;
  productVariant?: ProductVariant;
  title?: string;
  price: number;
  isAbstract: boolean;
  quantity: number;
  note?: string;
  details?: any;

  constructor(product?: Product, quantity?: number, productVariant?: ProductVariant) {
    this.quantity = quantity || 1;
    if (product) {
      this.title = product.title;
      this.price = Product.totalPrice(product);
      this.product = product;

      if (productVariant) {
        this.title = `${product.title} - ${productVariant.title}`;
        this.price = Product.totalPrice(product, productVariant);
        this.productVariant = productVariant;
      }
    }
  }
}
