import { DiscountCoupon } from './discount-coupon';
import { SmsAccount } from './sms-account';

export interface ClubConfig {
  anniversary: {
    isEnabled: boolean;
    marriageDateTemplateId: string;
    birthDateTemplateId: string;
    daysAgo: number;
    time: number;
    discountCoupon: {
      coupon: DiscountCoupon;
      durationInDay: number;
    };
  };
  minMemberWalletCharge: number;
}

export class Club {
  id: string;
  title: string;
  createdAt: Date;
  smsAccount: SmsAccount;
  config: ClubConfig;
}
