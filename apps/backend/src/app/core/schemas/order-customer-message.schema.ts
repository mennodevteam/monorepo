import { OrderCustomerMessage, OrderCustomerMessageEvent, OrderState, OrderType, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderCustomerMessageSchema = new EntitySchema<OrderCustomerMessage>({
  name: 'OrderCustomerMessage',
  target: OrderCustomerMessage,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    status: {
      type: 'simple-enum',
      enum: Status,
      default: Status.Active,
    },
    event: {
      type: 'simple-enum',
      enum: OrderCustomerMessageEvent,
    },
    manual: {
      type: Boolean,
      nullable: true,
    },
    orderStates: {
      type: 'simple-enum',
      enum: OrderState,
      array: true,
    },
    orderTypes: {
      type: 'simple-enum',
      enum: OrderType,
      array: true,
      default: [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
    },
    text: {
      type: String,
    },
    timeout: {
      type: Number,
      default: 0,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
