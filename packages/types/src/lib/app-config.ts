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
}
export class AppConfig {
  id: string;
  theme: Theme;
  themeMode: ThemeMode;
  selectableOrderTypes: OrderType[];
  disableOrdering: boolean;
  disableOrderingText: string;
  requiredPayment: OrderType[];
  requiredRegister: OrderType[];
  menuViewType: MenuViewType;
  menuCols: number;
}
