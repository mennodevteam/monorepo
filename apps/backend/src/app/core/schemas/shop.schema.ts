import { BusinessCategory, Shop, Status } from '@menno/types';
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
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    businessCategory: {
      type: 'enum',
      enum: BusinessCategory,
      nullable: true,
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
    prevServerUsername: {
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
    cover: {
      type: String,
      nullable: true,
    },
    verticalCover: {
      type: String,
      nullable: true,
    },
    logoImage: {
      type: 'simple-json',
      nullable: true,
    },
    coverImage: {
      type: 'simple-json',
      nullable: true,
    },
    verticalCoverImage: {
      type: 'simple-json',
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
    thirdParties: {
      type: 'one-to-many',
      target: 'ThirdParty',
      inverseSide: 'shop',
    },
    deliveryAreas: {
      type: 'one-to-many',
      target: 'DeliveryArea',
      inverseSide: 'shop',
      cascade: ['insert'],
    },
    plugins: {
      type: 'one-to-one',
      target: 'ShopPlugins',
      nullable: true,
      inverseSide: 'shop',
      joinColumn: true,
      cascade: ['insert'],
    },
  },
});
