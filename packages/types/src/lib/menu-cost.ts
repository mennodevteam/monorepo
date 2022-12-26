import { OrderType } from './order-type.enum';
import { Menu } from './menu';
import { Status } from './status.enum';
import { ProductCategory } from './product-category';
import { Product } from './product';

export class MenuCost {
  id: number;
  title: string;
  description: string;
  percentageCost: number;
  fixedCost: number;
  showOnItem: boolean;
  orderTypes: OrderType[];
  fromDate: Date;
  toDate: Date;
  status: Status;
  includeProductCategory: ProductCategory[];
  includeProduct: Product[];
  menu: Menu;
}
