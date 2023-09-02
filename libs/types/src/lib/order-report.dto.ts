import { OrderPaymentType } from './order-payment-type.enum';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';

export class OrderReportDto {
  shopId?: string;
  waiterId?: string;
  fromDate: Date;
  toDate: Date;
  customerId?: string;
  states?: OrderState[];
  payments?: OrderPaymentType[];
  types?: OrderType[];
  groupBy: 'date' | 'product' | 'category' | 'payment' | 'state' | 'type';
}
