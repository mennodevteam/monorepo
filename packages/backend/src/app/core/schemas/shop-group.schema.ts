import { ShopGroup } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopGroupSchema = new EntitySchema<ShopGroup>({
  name: 'ShopGroup',
  target: ShopGroup,
  columns: {
    id: {
      type: String,
      primary: true,
    },
    title: {
      type: String,
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    logo: {
      type: String,
      nullable: true,
    },
    code: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    listName: {
      type: String,
      nullable: true,
    },
  },
  relations: {
    shops: {
      type: 'one-to-many',
      inverseSide: 'shopGroup',
      target: 'Shop',
    },
  },
});
