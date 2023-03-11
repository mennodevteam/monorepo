import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Shop } from './shop';
import { Status } from './status.enum';

export enum OrderCustomerMessageEvent {
  Create = 'create',
  Status = 'status',
  Payment = 'payment',
}

export class OrderCustomerMessage {
  id: string;
  status: Status;
  event: OrderCustomerMessageEvent;
  manual?: boolean;
  orderTypes: OrderType[];
  orderStates: OrderState[];
  timeout?: number;
  text: string;
  shop: Shop;
}
