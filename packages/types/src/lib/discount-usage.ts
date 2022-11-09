import { DiscountCoupon } from './discount-coupon';
import { Member } from './member';

export class DiscountUsage {
  id: string;
  member: Member;
  createdAt: Date;
  discountCoupon: DiscountCoupon;
}
