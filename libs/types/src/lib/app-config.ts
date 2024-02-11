import { OrderType } from './order-type.enum';
import { Theme } from './theme';

export enum ThemeMode {
  Auto,
  Manual,
  Dark,
  Light,
}

export enum MenuViewType {
  Manual,
  Card,
  Grid,
  Compact,
}

export enum HomePage {
  Welcome = 'WELCOME',
  Info = 'INFO',
  Menu = 'MENU',
}
export class AppConfig {
  id: string;
  theme: Theme;
  themeMode: ThemeMode;
  homePage: HomePage;
  smsOnNewOrder: string[];
  selectableOrderTypes: OrderType[];
  disableOrdering: boolean;
  orderingTypes: OrderType[];
  disablePayment: boolean;
  disableOrderingText: string;
  disableOrderingOnClose: boolean;
  requiredPayment: OrderType[];
  requiredRegister: OrderType[];
  menuViewType: MenuViewType;
  ding: boolean;
  dings: string[];
  menuCols: number;
}
