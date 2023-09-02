import { DiscountCoupon } from "./discount-coupon";

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
    }
    minMemberWalletCharge: number;
}


export class Club {
    id: string;
    title: string;
    createdAt: Date;
    config: ClubConfig;
}