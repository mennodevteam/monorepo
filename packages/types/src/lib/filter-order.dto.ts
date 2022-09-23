import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';

export class FilterOrderDto {
  shopId?: string;
  fromDate?: Date;
  toDate?: Date;
  customerId?: string;
  waiterId?: string;
  isPayed?: boolean;
  paymentType?: 'online' | 'cash' | 'clubWallet';
  states?: OrderState[];
  fillProductsAndCategory?: boolean;
  types?: OrderType[];
  hasReview?: boolean;
  withDeleted?: boolean;
}
