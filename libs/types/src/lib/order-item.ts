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
  realPrice?: number;
  isAbstract: boolean;
  quantity: number;
  note?: string;
  details?: any;
  deletedAt?: Date;

  constructor(product?: Product, quantity?: number, productVariant?: ProductVariant) {
    this.quantity = quantity || 1;
    if (product) {
      this.title = product.title;
      this.product = product;

      if (productVariant) {
        this.title += ` - ${productVariant.title}`;
        this.productVariant = productVariant;
      }
      this.price = Product.totalPrice(product, productVariant);
      if (Product.hasDiscount(product, productVariant)) {
        this.realPrice = Product.realPrice(product, productVariant);
      }
    }
  }
}
