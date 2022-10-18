import { User } from 'src/core/models/user';
import { Shop } from 'src/shops/entities/shop';
import { ShopUserRole } from './shop-user-role.enum';

export class ShopUser {
  userId: string;
  shop: Shop;
  role: ShopUserRole;
  actions: string[];
  user: User;
}
