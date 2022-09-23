export class ManualSettlementDto {
  orderId: string;
  manualDiscount: number;
  manualCost: number;
  posPayed: number[];
  isFromWallet: boolean;
}
