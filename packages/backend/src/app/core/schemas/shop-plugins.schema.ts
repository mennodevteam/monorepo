import { Plugin, ShopPlugins, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopPluginsSchema = new EntitySchema<ShopPlugins>({
  name: 'ShopPlugins',
  target: ShopPlugins,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    expiredAt: {
      type: 'timestamptz',
      nullable: true,
    },
    plugins: {
      type: 'enum',
      enum: Plugin,
      array: true,
      default: [],
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
      inverseSide: 'plugins'
    },
  },
});
