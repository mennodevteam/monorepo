import { AppConfig, OrderType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AppConfigSchema = new EntitySchema<AppConfig>({
  name: 'AppConfig',
  target: AppConfig,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    viewMode: {
      type: Boolean,
      default: false,
    },
    orderTypes: {
      type: 'enum',
      enum: OrderType,
      array: true,
      default: [OrderType.Takeaway, OrderType.Delivery, OrderType.DineIn],
    },
    payBefore: {
      type: Boolean,
      default: false,
    },
    loginBefore: {
      type: Boolean,
      default: true,
    },
    selectableOrderTypes: {
      type: 'enum',
      enum: OrderType,
      array: true,
      default: [OrderType.Takeaway, OrderType.Delivery, OrderType.DineIn],
    },
    ding: {
      type: String,
      default: [],
      array: true,
    },
    onlinePayment: {
      type: Boolean,
      default: true,
    },
    disableOrderingOutsideTime: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      nullable: true,
    },
    details: {
      type: 'simple-json',
      default: {},
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
  uniques: [
    {
      name: 'UNIQUE_SHOP',
      columns: ['shop'],
    },
  ],
});
