import { OrderType } from './order-type.enum';
import { Shop } from './shop';

export class AppConfig {
  id: string;
  viewMode: boolean;
  orderTypes: OrderType[];
  payBefore: boolean;
  loginBefore: boolean;
  onlinePayment: boolean;
  ding: string[];
  selectableOrderTypes: OrderType[];
  theme: string;
  disableOrderingOutsideTime: boolean;
  shop: Shop;
  details: any;
}
