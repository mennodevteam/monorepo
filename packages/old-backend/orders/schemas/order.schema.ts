import { Order, OrderState, OrderType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderSchema = new EntitySchema<Order>({
  name: 'Order',
  target: Order,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    qNumber: {
      type: Number,
      nullable: true,
    },
    state: {
      type: 'enum',
      enum: OrderState,
      default: OrderState.Pending,
    },
    type: {
      type: 'enum',
      enum: OrderType,
    },
    packOrderId: {
      type: String,
      nullable: true,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    isPayed: {
      type: Boolean,
      default: false,
    },
    mergeFrom: {
      type: String,
      array: true,
      nullable: true,
    },
    totalPrice: {
      type: 'real',
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      nullable: true,
      deleteDate: true,
    },
  },
  relations: {
    items: {
      type: 'one-to-many',
      target: 'OrderItem',
      cascade: true,
      inverseSide: 'order',
    },
    mergeTo: {
      type: 'many-to-one',
      target: 'Order',
      nullable: true,
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    reviews: {
      type: 'one-to-many',
      target: 'OrderReview',
      cascade: true,
      inverseSide: 'order',
    },
    customer: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
    creator: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
    waiter: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
  },
});
