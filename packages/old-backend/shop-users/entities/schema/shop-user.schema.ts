import { EntitySchema } from 'typeorm';
import { ShopUser } from '../shop-user';
import { ShopUserRole } from '../shop-user-role.enum';

export const ShopUserSchema = new EntitySchema<ShopUser>({
  name: 'ShopUser',
  target: ShopUser,
  columns: {
    userId: {
      type: 'uuid',
      primary: true,
    },
    role: {
      type: 'enum',
      enum: ShopUserRole,
      default: ShopUserRole.Admin,
    },
    actions: {
      type: String,
      array: true,
      nullable: true,
      default: [],
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
