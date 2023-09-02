import { Club } from "./club";
import { DiscountCoupon } from "./discount-coupon";

export interface MissionReward {
    gem?: number;
    discountCoupon?: {
        coupon: DiscountCoupon;
        durationInDay: number;
    };
}

export interface MissionCondition {
    perPurchase: {
        minimumPrice: number;
    }
    weekly: {
        total: number;
        count: number;
    },
    monthly: {
        total: number;
        count: number;
    },
    yearly: {
        total: number;
        count: number;
    }
    items: string[];
    labels: string[];
}

export class Mission {
    id: number;
    title: string;
    description: string;
    club: Club;
    condition: MissionCondition;
    reward: MissionReward;
    startedAt: Date;
    expiredAt: Date;
    createdAt: Date;
    deletedAt: Date;
}