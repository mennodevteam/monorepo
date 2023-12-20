export enum PaymentGatewayType {
  Sizpay = 'sizpay',
  Zibal = 'zibal',
  Zarinpal = 'zarinpal'
}

export class PaymentGateway {
  id: string;
  title?: string;
  type: PaymentGatewayType;
  keys: any;
  createdAt: Date;
}
