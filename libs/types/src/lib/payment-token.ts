import { PaymentGateway } from './payment-gateway';

export interface AppExtraInfo {
  PayerNm: string;
  PayerMobile: string;
  PayerEmail: string;
  Descr: string;
  PayerIP: string;
  PayTitle: string;
}

export class PaymentToken {
  id: string;
  orderId: string;
  invoiceId: string;
  returnUrl: string;
  userId: string;
  userPhone: string;
  appReturnUrl: string;
  shopId: string;
  details: any;
  amount: number;
  extraInfo: AppExtraInfo;
  gateway?: PaymentGateway;
  createdAt: Date;
}
