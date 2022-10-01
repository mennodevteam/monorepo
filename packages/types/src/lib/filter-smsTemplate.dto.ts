import { SmsAccount } from './sms-account';

export class FilterSmsTemplate {
  account: SmsAccount;
  isVerified: boolean;
  take: number;
  skip: number;
}
