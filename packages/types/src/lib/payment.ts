export class Payment {
  id: string;
  amount: number;
  message?: string;
  details?: any;
  userId: string;
  userPhone: string;
  invoiceId: string;
  token: string;
  businessId: string;
  referenceId: string;
  appReturnUrl: string;
  isCompleted: boolean;
  confirmedAt?: Date;
  reversedAt?: Date;
  createdAt: Date;
}
