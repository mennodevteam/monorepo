import { Shop } from './shop';
import { ShopBankInfo } from './shop-bankInfo';

export class ShopSettlement {
  id: number;
  amount: number;
  fromDate: Date;
  toDate: Date;
  details: {
    IBAN: string;
    firstName: string;
    lastName: string;
  };
  trackingCode: string;
  shop: Shop;
  shopBankInfo: ShopBankInfo;
  isCompleted: boolean;
  settlementedAt: Date;
  createdAt: Date;
  deletedAt: Date;
}
