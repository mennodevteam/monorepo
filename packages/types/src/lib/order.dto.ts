import { OrderDetails } from './order';
import { OrderPaymentType } from './order-payment-type.enum';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Payment } from './payment';

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
  payment?: Payment;
  manualCost?: number;
  paymentType?: OrderPaymentType;
  note?: string;
  details?: OrderDetails;
  productItems: {
    productId: string;
    quantity: number;
  }[];
}
