import { Menu } from './menu';
import { Product } from './product';
import { User } from './user';

export enum StatAction {
  LoadMenu = 'LOAD_MENU',
  ClickProduct = 'CLICK_PRODUCT',
}

export class MenuStat {
  id: string;
  createdAt: Date;
  action: StatAction;
  referrer?: string;
  campaign?: string;
  user: User;
  menu: Menu;
  product?: Product;
}
