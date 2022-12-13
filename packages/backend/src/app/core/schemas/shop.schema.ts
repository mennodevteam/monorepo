import { Shop } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopSchema = new EntitySchema<Shop>({
  name: 'Shop',
  target: Shop,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
    },
    code: {
      type: String,
      nullable: true,
      unique: true,
    },
    prevServerCode: {
      type: String,
      nullable: true,
    },
    username: {
      type: String,
      nullable: true,
      unique: true,
    },
    lastDisconnectAlertAt: {
      type: 'timestamptz',
      nullable: true,
    },
    location: {
      type: 'simple-json',
      default: {},
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    options: {
      type: 'simple-json',
      default: {},
    },
    images: {
      type: String,
      array: true,
      default: [],
    },
    logo: {
      type: String,
      nullable: true,
    },
    bankPortalId: {
      type: String,
      nullable: true,
    },
    deliveryAccountId: {
      type: String,
      nullable: true,
    },
    phones: {
      type: String,
      array: true,
      default: [],
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    connectionAt: {
      type: 'timestamptz',
      nullable: true,
    },
  },
  relations: {
    menu: {
      cascade: ['insert'],
      type: 'many-to-one',
      target: 'Menu',
      nullable: true,
    },
    region: {
      cascade: ['insert'],
      type: 'many-to-one',
      target: 'Region',
    },
    shopGroup: {
      type: 'many-to-one',
      target: 'ShopGroup',
      inverseSide: 'shops',
      nullable: true,
    },
    smsAccount: {
      type: 'many-to-one',
      target: 'SmsAccount',
      cascade: ['insert'],
      nullable: true,
    },
    club: {
      cascade: ['insert'],
      type: 'many-to-one',
      target: 'Club',
      nullable: true,
    },
    users: {
      type: 'one-to-one',
      target: 'ShopUser',
      inverseSide: 'shop',
      cascade: ['insert'],
    },
  },
});
