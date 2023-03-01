import { Menu } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MenuSchema = new EntitySchema<Menu>({
  name: 'Menu',
  target: Menu,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
      nullable: true,
    },
    currency: {
      type: String,
      nullable: true,
    },
  },
  relations: {
    categories: {
      type: 'one-to-many',
      target: 'ProductCategory',
      inverseSide: 'menu',
    },
    costs: {
      type: 'one-to-many',
      target: 'MenuCost',
      inverseSide: 'menu',
    },
  },
});
