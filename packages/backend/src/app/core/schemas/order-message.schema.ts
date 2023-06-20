import {
  OrderMessage,
  OrderMessageEvent,
  OrderPaymentType,
  OrderState,
  OrderType,
  Status,
} from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderMessageSchema = new EntitySchema<OrderMessage>({
  name: 'OrderMessage',
  target: OrderMessage,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    event: {
      type: 'simple-enum',
      enum: OrderMessageEvent,
    },
    type: {
      type: 'simple-enum',
      enum: OrderType,
      nullable: true,
    },
    state: {
      type: 'simple-enum',
      enum: OrderState,
      nullable: true,
    },
    payment: {
      type: 'simple-enum',
      enum: OrderPaymentType,
      nullable: true,
    },
    status: {
      type: 'simple-enum',
      enum: Status,
      default: Status.Active,
    },
    delayInMinutes: {
      type: Number,
      default: 0,
    },
    isManual: {
      type: Boolean,
      nullable: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    smsTemplate: {
      type: 'many-to-one',
      target: 'SmsTemplate',
    },
  },
});
