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
    utmSource: {
      type: String,
      nullable: true,
    },
    utmMedium: {
      type: String,
      nullable: true,
    },
    utmCampaign: {
      type: String,
      nullable: true,
    },
    utmTerm: {
      type: String,
      nullable: true,
    },
    utmContent: {
      type: String,
      nullable: true,
    },
    guestId: {
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
    campaignRef: {
      type: 'many-to-one',
      target: 'Campaign',
      nullable: true,
    },
  },
});
