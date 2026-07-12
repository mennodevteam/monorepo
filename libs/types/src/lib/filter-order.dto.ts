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
  types?: OrderType[];
  skip?: number;
  withCount?: boolean;
  take?: number;
  hasReview?: boolean;
  withDeleted?: boolean;
  updatedAt?: Date;
  /** Case-insensitive substring match on `order.details.referrer` (JSON) */
  detailsReferrer?: string;
  campaignId?: string;
}
