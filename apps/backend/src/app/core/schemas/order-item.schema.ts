import { OrderItem } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderItemSchema = new EntitySchema<OrderItem>({
  name: 'OrderItem',
  target: OrderItem,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
      nullable: true,
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    isAbstract: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      nullable: true,
    },
    price: {
      type: 'real',
    },
    realPrice: {
      type: 'real',
      nullable: true,
    },
    quantity: {
      type: Number,
    },
    deletedAt: {
      type: 'timestamptz',
      nullable: true,
      deleteDate: true,
    },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      inverseSide: 'items',
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
    },
    productVariant: {
      type: 'many-to-one',
      target: 'ProductVariant',
      nullable: true,
    },
  },
});
