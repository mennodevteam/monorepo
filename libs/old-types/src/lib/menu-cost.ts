import { OrderType } from './order-type.enum';
import { Menu } from './menu';

export class MenuCost {
  id: number;
  title: string;
  description: string;
  percentageCost: number;
  fixedCost: number;
  showOnItem: boolean;
  orderTypes: OrderType[];
  includeProductCategoryIds: number[];
  includeProductIds: string[];
  menu: Menu;
}
