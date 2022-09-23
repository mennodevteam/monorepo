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
  details: any;
  limitQuantity: boolean;
  stockItem: StockItem;
  costs?: MenuCost[];
  createdAt?: Date;
  deletedAt?: Date;
}
