import { SmsAccount } from './sms-account';
import { SmsGroup } from './sms-group';
import { SmsStatus } from './sms-status.enum';

export class Sms {
  id: string;
  kavenegarId?: string;
  message: string;
  group?: SmsGroup;
  account: SmsAccount;
  receptor: string;
  cost: number;
  status: SmsStatus;
  statusDescription: string;
  sentAt?: Date;
  createdAt: Date;
}
