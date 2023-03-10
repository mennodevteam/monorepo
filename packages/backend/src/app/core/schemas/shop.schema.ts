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
    instagram: {
      type: String,
      nullable: true,
      unique: true,
    },
    domain: {
      type: String,
      nullable: true,
      unique: true,
    },
    latitude: {
      type: 'real',
      nullable: true,
    },
    longitude: {
      type: 'real',
      nullable: true,
    },
    address: {
      type: String,
      nullable: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    lastDisconnectAlertAt: {
      type: 'timestamptz',
      nullable: true,
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
    appConfig: {
      cascade: ['insert'],
      type: 'many-to-one',
      target: 'AppConfig',
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
    paymentGateway: {
      type: 'many-to-one',
      target: 'PaymentGateway',
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
      type: 'one-to-many',
      target: 'ShopUser',
      inverseSide: 'shop',
      cascade: ['insert'],
    },
    deliveryAreas: {
      type: 'one-to-many',
      target: 'DeliveryArea',
      inverseSide: 'shop',
      cascade: ['insert'],
    },
  },
});
