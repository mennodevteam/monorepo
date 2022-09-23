import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';

interface CustomerMessageOnStateChangeConfig {
  orderType: OrderType;
  orderStates: OrderState[];
}
export class OrderConfig {
  shopId: string;
  qNumberStart?: number;
  customerMessageOnStateChange: OrderState[];
  customerMessageOnStateChangeConfig: CustomerMessageOnStateChangeConfig[];
  dineInStates: OrderState[];
  deliveryStates: OrderState[];
  takeawayStates: OrderState[];
  mobilePhonesOnNewOrder: string[];
  autoSendLinkToCustomer: boolean;
}
