import { Club } from './club';
import { Member } from './member';

export class DiscountCoupon {
  id: string;
  title: string;
  createdAt: Date;
  expiredAt: Date;
  startedAt: Date;
  fixedDiscount: number;
  isEnabled: boolean;
  star?: number;
  deletedAt?: Date;
  percentageDiscount: number;
  minPrice: number;
  maxDiscount: number;
  code: string;
  club: Club;
  member: Member;
}
