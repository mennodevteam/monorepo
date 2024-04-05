import { Club } from './club';
import { DiscountCoupon } from './discount-coupon';
import { Status } from './status.enum';

export enum MissionConditionPeriod {
  PerPurchase = 'PER_PURCHASE',
  Weekly = 'WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY',
}
export enum MissionRewardType {
  DiscountCoupon = 'DISCOUNT_COUPON',
  WalletCharge = 'WALLET_CHARGE',
}

export class Mission {
  id: number;
  title: string;
  status: Status;
  description?: string;
  club: Club;
  conditionPeriod: MissionConditionPeriod;
  orderCount: number;
  orderSum: number;
  rewardType: MissionRewardType;
  rewardValue: number;
  rewardDetails?: DiscountCoupon | null;
  durationInDays?: number;
  startedAt: Date;
  expiredAt: Date;
  createdAt: Date;
  deletedAt: Date;
}
