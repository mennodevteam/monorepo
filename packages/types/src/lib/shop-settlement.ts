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
  isCompleted: boolean;
  settlementedAt: Date;
  createdAt: Date;
  deletedAt: Date;
}
