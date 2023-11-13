import { Sms } from './sms';
import { SmsAccount } from './sms-account';
import { SmsStatus } from './sms-status.enum';

export class SmsGroup {
  id: string;
  message: string;
  list: Sms[];
  createdAt: Date;
  account: SmsAccount;
  count?: number;
  cost?: number;
  receptors?: string[];
  statusCount: number[];
}
