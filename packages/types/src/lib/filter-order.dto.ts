import { OrderPaymentType } from './order-payment-type.enum';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';

export class FilterOrderDto {
  shopId?: string;
  fromDate?: Date;
  toDate?: Date;
  customerId?: string;
  creatorId?: string;
  waiterId?: string;
  isManual?: boolean;
  paymentTypes?: OrderPaymentType[];
  states?: OrderState[];
  fillProductsAndCategory?: boolean;
  types?: OrderType[];
  hasReview?: boolean;
  withDeleted?: boolean;
}
