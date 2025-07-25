import { SmsAccount } from './sms-account';
import { Status } from './status.enum';

export class AiChatbot {
  id: number;
  smsAccount: SmsAccount;
  status: Status;
  style?: string;
  extraInfo?: string;
  introMessage?: string;
  createdAt: Date;
}
