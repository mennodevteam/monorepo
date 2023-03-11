import { Order, OrderPaymentType, OrderState, OrderType } from '@menno/types';
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
    isManual: {
      type: Boolean,
      default: false,
    },
    paymentType: {
      type: 'enum',
      enum: OrderPaymentType,
      default: OrderPaymentType.NotPayed,
    },
    mergeFrom: {
      type: String,
      array: true,
      nullable: true,
    },
    note: {
      type: String,
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
    updatedAt: {
      type: 'timestamptz',
      updateDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      nullable: true,
      deleteDate: true,
    },
  },
  relations: {
    creator: {
      type: 'many-to-one',
      target: 'User',
    },
    customer: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
    waiter: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
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
    payment: {
      type: 'many-to-one',
      target: 'Payment',
      nullable: true,
    },
    reviews: {
      type: 'one-to-many',
      target: 'OrderReview',
      cascade: true,
      inverseSide: 'order',
    },
  },
});
