import { Status } from './status.enum';
import { ProductCategory } from './product-category';
import { StockItem } from './stock-item';
import { MenuCost } from './menu-cost';
import { OrderType } from './order-type.enum';
import { OrderItem } from './order-item';

export class Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  status: Status;
  position?: number;
  category: ProductCategory;
  images?: string[];
  orderTypes: OrderType[];
  packItems: string[];
  details: any;
  limitQuantity: boolean;
  stockItem: StockItem;
  costs?: MenuCost[];
  _orderItem?: OrderItem;
  createdAt?: Date;
  deletedAt?: Date;

  static sort(products: Product[]) {
    products.sort((a, b) => {
      if (a.position != undefined && b.position == undefined) return -1;
      if (b.position != undefined && a.position == undefined) return 1;
      if (a.position == b.position && a.createdAt && b.createdAt) {
        return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
      }
      if (a.position != undefined && b.position != undefined) return a.position - b.position;
      return 1;
    });
  }

  static totalPrice(product: Product, round = 500) {
    let cost = 0;
    const showCosts = product.costs?.filter((x) => x.showOnItem);
    if (showCosts) {
      for (const c of showCosts) {
        if (c.fixedCost) cost += c.fixedCost;
        if (c.percentageCost) {
          const dis = (product.price * c.percentageCost) / 100;
          cost += Math.floor(dis / round) * round;
        }
      }
    }
    return Math.max(product.price + cost, 0);
  }

  static fixedDiscount(product: Product) {
    const cost = product.price - Product.totalPrice(product);
    if (cost > 0) return cost;
    return 0;
  }

  static percentageDiscount(product: Product) {
    const cost = product.price - Product.totalPrice(product);
    if (cost > 0) return Math.round((cost / product.price) * 100);
    return 0;
  }

  static hasDiscount(product: Product) {
    if (this.totalPrice(product) < product.price) return true;
    return false;
  }
}
