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
export class AppConfig {
  id: string;
  theme: Theme;
  themeMode: ThemeMode;
  selectableOrderTypes: OrderType[];
  disableOrdering: boolean;
  disablePayment: boolean;
  disableOrderingText: string;
  disableOrderingOnClose: boolean;
  requiredPayment: OrderType[];
  requiredRegister: OrderType[];
  menuViewType: MenuViewType;
  ding: boolean;
  dings: string[]
  menuCols: number;
}
