import { OrderDetails } from './order';
import { OrderPaymentType } from './order-payment-type.enum';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';

export class OrderDto {
  id?: string;
  shopId: string;
  customerId?: string;
  creatorId?: string;
  waiterId?: string;
  state?: OrderState;
  type: OrderType;
  isManual?: boolean;
  packOrderId?: string;
  manualDiscount?: number;
  manualCost?: number;
  paymentType?: OrderPaymentType;
  note?: string;
  details?: OrderDetails;
  productItems: {
    productId: string;
    quantity: number;
  }[];
}
