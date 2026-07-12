import { Shop } from './shop';

export interface CampaignAction {
  type: 'free_delivery' | 'product_discount' | 'category_discount';
  payload: {
    minOrderValue?: number;
    productId?: string;
    variantId?: number;
    categoryId?: string;
    discountType?: 'percent' | 'fixed';
    discountValue?: number;
  };
}

export interface CampaignManualCost {
  title: string;
  amount: number;
}

export class Campaign {
  id: string;
  shop: Shop;
  title: string;
  startDate: Date;
  endDate: Date;
  enabled: boolean;
  actions: CampaignAction[];
  manualCosts: CampaignManualCost[];

  // Welcome dialog properties
  showWelcomeDialog: boolean;
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeImageUrl?: string;
  welcomeCtaText?: string;
  welcomeCtaUrl?: string;
  showCountdown?: boolean;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  static isActive(campaign: Campaign, date: Date = new Date()): boolean {
    if (!campaign) return false;
    const t = new Date(date).getTime();
    return (
      new Date(campaign.startDate).getTime() <= t &&
      new Date(campaign.endDate).getTime() >= t
    );
  }
}
