export enum PaymentGatewayType {
  Sizpay = 'sizpay',
}

export class PaymentGateway {
  id: string;
  title?: string;
  type: PaymentGatewayType;
  keys: any;
  createdAt: Date;
}
