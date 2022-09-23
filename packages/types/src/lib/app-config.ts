import { OrderType } from './order-type.enum';
import { Shop } from './shop';

export class AppConfig {
  id: string;
  viewMode: boolean;
  payBefore: boolean;
  loginBefore: boolean;
  onlinePayment: boolean;
  ding: string[];
  orderTypes: OrderType[];
  orderType: OrderType;
  theme: string;
  disableOrderingOutsideTime: boolean;
  shop: Shop;
}
