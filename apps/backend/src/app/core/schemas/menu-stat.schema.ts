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
    referrer: {
      type: String,
      nullable: true,
    },
    campaign: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    value: {
      type: 'float',
      nullable: true,
    },
    // Persian calendar date components (Tehran timezone) - for fast querying
    createdAtLocalDate: {
      type: String,
      nullable: true,
    }, // Format: "1403-07-15" (YYYY-MM-DD)
    createdAtLocalTime: {
      type: String,
      nullable: true,
    }, // Format: "14:30:45" (HH:mm:ss)
    createdAtLocalDayOfWeek: {
      type: Number,
      nullable: true,
    }, // 1 = Saturday (شنبه), 2 = Sunday (یکشنبه), ..., 7 = Friday (جمعه)
  },
  relations: {
    menu: {
      type: 'many-to-one',
      target: 'Menu',
    },
    user: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
      nullable: true,
    },
  },
});
