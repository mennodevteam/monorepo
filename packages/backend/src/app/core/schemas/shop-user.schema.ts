import { ShopUser, ShopUserRole } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopUserSchema = new EntitySchema<ShopUser>({
  name: 'ShopUser',
  target: ShopUser,
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
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
    user: {
      type: 'many-to-one',
      target: 'User',
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
