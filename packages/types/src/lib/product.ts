import { Status } from './status.enum';
import { ProductCategory } from './product-category';
import { StockItem } from './stock-item';
import { MenuCost } from './menu-cost';
import { OrderType } from './order-type.enum';

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
}
