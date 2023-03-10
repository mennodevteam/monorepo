import { User } from './user';
import { Shop } from './shop';
import { ShopUserRole } from './shop-user-role.enum';
export enum UserAction {
  Report = 'report',
  Menu = 'menu',
  Order = 'order',
  HideDailyTotal = 'hideDailyTotal',
  Club = 'club',
  ChargeMemberWallet = 'chargeMemberWallet',
  Sms = 'sms',
  Marketing = 'marketing',
  Payment = 'payment',
  Coupons = 'coupons',
  Setting = 'setting'
}
export class ShopUser {
  userId: string;
  shop: Shop;
  role: ShopUserRole;
  actions: UserAction[];
  user: User;
}
