import { Order } from './order';
import { Product } from './product';

export class OrderItem {
  id: string;
  order: Order;
  product?: Product;
  title?: string;
  price: number;
  isAbstract: boolean;
  quantity: number;
  note?: string;
  details?: any;

  constructor(product?: Product, quantity?: number) {
    if (product) {
      this.quantity = quantity || 1;
      this.title = product.title;
      this.price = Product.totalPrice(product);
      this.product = product;
    }
  }
}
