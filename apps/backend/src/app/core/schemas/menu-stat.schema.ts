import { MenuStat, StatAction } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MenuStatSchema = new EntitySchema<MenuStat>({
  name: 'MenuStat',
  target: MenuStat,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    action: {
      type: 'enum',
      enum: StatAction,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    menu: {
      type: 'many-to-one',
      target: 'Menu',
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
      nullable: true,
    },
  },
});
