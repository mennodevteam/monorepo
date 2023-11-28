import { Status } from './status.enum';
import { ProductCategory } from './product-category';
import { StockItem } from './stock-item';
import { MenuCost } from './menu-cost';
import { OrderType } from './order-type.enum';
import { ProductItem } from './order.dto';
import { ProductVariant } from './product-variant';

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
  stock?: number | null;
  costs?: MenuCost[];
  variants: ProductVariant[];
  thirdPartyId?: string;
  _orderItem?: ProductItem;
  _changingStatus?: boolean;
  updatedAt?: Date;
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

  static realPrice(product: Product, productVariant?: ProductVariant, round = 500) {
    let cost = 0;
    const price = productVariant ? productVariant.price : product.price;
    const showCosts = product.costs?.filter((x) => x.showOnItem && (x.fixedCost > 0 || x.percentageCost > 0));
    if (showCosts) {
      for (const c of showCosts) {
        if (c.fixedCost) cost += c.fixedCost;
        if (c.percentageCost) {
          const dis = (price * c.percentageCost) / 100;
          cost += dis;
        }
      }
    }
    const total = Math.floor((price + cost) / round) * round;
    return Math.max(total, 0);
  }

  static totalPrice(product: Product, productVariant?: ProductVariant, round = 500) {
    let cost = 0;
    const price = productVariant ? productVariant.price : product.price;
    const showCosts = product.costs?.filter((x) => x.showOnItem);
    if (showCosts) {
      for (const c of showCosts) {
        if (c.fixedCost) cost += c.fixedCost;
        if (c.percentageCost) {
          const dis = (price * c.percentageCost) / 100;
          cost += dis;
        }
      }
    }
    const total = Math.floor((price + cost) / round) * round;
    return Math.max(total, 0);
  }

  static fixedDiscount(product: Product, productVariant?: ProductVariant) {
    const cost = Product.realPrice(product, productVariant) - Product.totalPrice(product, productVariant);
    if (cost > 0) return cost;
    return 0;
  }

  static percentageDiscount(product: Product, productVariant?: ProductVariant, round = 5) {
    const price = productVariant ? productVariant.price : product.price;
    const cost = Product.realPrice(product, productVariant) - Product.totalPrice(product, productVariant);
    if (cost > 0) return Math.round((cost / price) * 100 / round) * round;
    return 0;
  }

  static hasDiscount(product: Product, productVariant?: ProductVariant) {
    if (Product.totalPrice(product, productVariant) < Product.realPrice(product, productVariant)) return true;
    return false;
  }
}
