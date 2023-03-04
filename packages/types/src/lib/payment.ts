import { PaymentGateway } from './payment-gateway';
export class Payment {
  id: string;
  amount: number;
  message?: string;
  details?: any;
  userId: string;
  userPhone: string;
  invoiceId: string;
  token: string;
  shopId: string;
  referenceId: string;
  appReturnUrl: string;
  gateway: PaymentGateway;
  isCompleted: boolean;
  confirmedAt?: Date;
  reversedAt?: Date;
  createdAt: Date;
}
