import { Shop } from './shop';
import { SmsAccount } from './sms-account';
import { Status } from './status.enum';
import { User } from './user';

export class AiChatbot {
  id: number;
  smsAccount: SmsAccount;
  status: Status;
  style?: string;
  extraInfo?: string;
  introMessage?: string;
  createdAt: Date;
}

export class AiChat {
  id: number;
  shop: Shop;
  aiChatbot: AiChatbot;
  user: User;
  messages: AiChatMessage[];
  createdAt: Date;
}

export class AiChatMessage {
  id: number;
  aiChat: AiChat;
  message: string;
  isFromUser: boolean;
  createdAt: Date;
}
