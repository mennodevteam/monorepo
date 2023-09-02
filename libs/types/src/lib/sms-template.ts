import { Shop } from './shop';
import { SmsAccount } from './sms-account';
import { User } from './user';

export class SmsTemplate {
  id: string;
  account?: SmsAccount;
  creatorId?: string;
  message: string;
  isVerified?: boolean;
  responseText?: string;
  title: string;
  createdAt: Date;

  static getTemplateParams(users: User[], shop: Shop, appOrigin: string) {
    const shopLink = Shop.appLink(shop, appOrigin);
    return {
      '@@@': users.map((x) => User.fullName(x)),
      '###': users.map((x) => shopLink),
      '***': users.map((x) => shop.title),
    };
  }
}
