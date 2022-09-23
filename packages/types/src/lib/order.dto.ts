import { OrderDetails } from './order';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';

export class OrderDto {
  id: string;
  shopId: string;
  customerId?: string;
  creatorId?: string;
  state: OrderState;
  type: OrderType;
  isManual: boolean;
  manualDiscount?: number;
  manualCost?: number;
  isPayed: boolean;
  details: OrderDetails;
  productItems: {
    productId: string;
    quantity: number;
  }[];
}
