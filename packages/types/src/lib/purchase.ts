import { DiscountCoupon } from './discount-coupon';
import { Member } from './member';

export class Purchase {
  id: number;
  items: string[];
  labels: string[];
  price: number;
  gem: number;
  discountCoupon: DiscountCoupon;
  member: Member;
  createdAt?: Date;
  deletedAt?: Date;
}
