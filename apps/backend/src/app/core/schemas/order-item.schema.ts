import { OrderItem } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderItemSchema = new EntitySchema<OrderItem>({
  name: 'OrderItem',
  target: OrderItem,
  indices: [
    {
      name: 'idx_order_item_order',
      columns: ['order'],
    },
    {
      name: 'idx_order_item_order_deleted_at',
      columns: ['order', 'deletedAt'],
    },
  ],
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
    materialCost: {
      type: 'real',
      nullable: true,
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
