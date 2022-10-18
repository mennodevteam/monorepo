import { Plugin, ShopPlugin, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopPluginSchema = new EntitySchema<ShopPlugin>({
  name: 'ShopPlugin',
  target: ShopPlugin,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    expiredAt: {
      type: 'timestamptz',
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    plugin: {
      type: 'enum',
      enum: Plugin,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
  indices: [
    {
      name: 'UNIQUE_SHOP_PLUGIN',
      unique: true,
      columns: ['shop', 'plugin'],
    },
  ],
});
