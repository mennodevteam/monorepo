import { Order } from './order';
import { Product } from './product';
import { ProductVariant } from './product-variant';

export const ORDER_ITEM_ADD_INDEX_KEY = 'addIndex';

export function getOrderItemAddIndex(item: OrderItem): number | undefined {
  const value = item.details?.[ORDER_ITEM_ADD_INDEX_KEY];
  return typeof value === 'number' ? value : undefined;
}

export function sortOrderItemsByAddIndex<T extends OrderItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.isAbstract !== b.isAbstract) return a.isAbstract ? 1 : -1;
    const ai = getOrderItemAddIndex(a);
    const bi = getOrderItemAddIndex(b);
    if (ai == null && bi == null) return 0;
    if (ai == null) return 1;
    if (bi == null) return -1;
    return ai - bi;
  });
}

export class OrderItem {
  id: string;
  order: Order;
  product?: Product;
  productVariant?: ProductVariant;
  title?: string;
  price: number;
  materialCost?: number;
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
