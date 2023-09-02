import { OrderPaymentType } from "./order-payment-type.enum";

export class ManualSettlementDto {
  orderId: string;
  manualDiscount?: number;
  manualCost?: number;
  posPayed?: number[];
  type: OrderPaymentType;
}
