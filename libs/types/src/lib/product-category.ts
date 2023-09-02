import { Status } from './status.enum';
import { Menu } from './menu';
import { Product } from './product';
import { OrderType } from './order-type.enum';
import { MenuCost } from './menu-cost';

export class ProductCategory {
  id: number;
  title: string;
  description?: string;
  faIcon?: string;
  status: Status;
  orderTypes: OrderType[];
  products?: Product[];
  position?: number;
  star?: number;
  menu: Menu;
  thirdPartyId?: string;
  costs?: MenuCost[];
  updatedAt?: Date;
  createdAt?: Date;
  deletedAt?: Date;
  
  static sort(cats: ProductCategory[]) {
    cats.sort((a, b) => {
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
