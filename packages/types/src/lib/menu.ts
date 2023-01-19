import { MenuCost } from './menu-cost';
import { ProductCategory } from './product-category';

export enum MenuViewType {
  Manual,
  Card,
  Grid,
}

export class Menu {
  id: string;
  title?: string;
  currency?: string;
  costs: MenuCost[];
  categories?: ProductCategory[];
  viewType: MenuViewType;
  cols: number;
}
