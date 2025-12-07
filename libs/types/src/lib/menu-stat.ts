import { Menu } from './menu';
import { Product } from './product';
import { User } from './user';

export enum StatAction {
  LoadMenu = 'LOAD_MENU',
  ClickProduct = 'CLICK_PRODUCT',
  AddToCart = 'ADD_TO_CART',
  ViewCart = 'VIEW_CART',
  ViewCheckout = 'VIEW_CHECKOUT',
  GoToBank = 'GO_TO_BANK',
  AddOrder = 'ADD_ORDER',
  SelectAddress = 'SELECT_ADDRESS',
  AddAddress = 'ADD_ADDRESS',
  LoginSetPhone = 'LOGIN_SET_PHONE',
  LoginComplete = 'LOGIN_COMPLETE',
  RegisterComplete = 'REGISTER_COMPLETE',
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
  value?: number;
  // Persian calendar date components (Tehran timezone) - for fast querying
  createdAtLocalDate?: string; // Format: "1403-07-15" (YYYY-MM-DD)
  createdAtLocalTime?: string; // Format: "14:30:45" (HH:mm:ss)
  createdAtLocalDayOfWeek?: number; // 1 = Saturday (شنبه), 2 = Sunday (یکشنبه), ..., 7 = Friday (جمعه)
}

export class MenuStatDto {
  action: StatAction;
  menuId: string;
  productId?: string;
  value?: number;
  referrer?: string;
  campaign?: string;
}
