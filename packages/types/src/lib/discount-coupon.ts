import { Club } from './club';
import { Member } from './member';
import { OrderType } from './order-type.enum';
import { Status } from './status.enum';

export class DiscountCoupon {
  id: string;
  title: string;
  createdAt: Date;
  expiredAt: Date;
  startedAt: Date;
  fixedDiscount: number;
  status: Status;
  orderTypes?: OrderType[];
  star?: number;
  deletedAt?: Date;
  percentageDiscount: number;
  minPrice: number;
  maxDiscount: number;
  maxUsePerUser: number;
  maxUse: number
  code: string;
  club: Club;
  member: Member;
}
