import { OrderType, Product, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ProductSchema = new EntitySchema<Product>({
  name: 'Product',
  target: Product,
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
    position: {
      type: Number,
      nullable: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    limitQuantity: {
      type: Boolean,
      default: false,
    },
    price: {
      type: 'real',
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
    images: {
      type: String,
      array: true,
      default: [],
    },
    packItems: {
      type: String,
      array: true,
      default: [],
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    orderTypes: {
      type: 'enum',
      enum: OrderType,
      array: true,
      default: [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
    },
  },
  relations: {
    category: {
      type: 'many-to-one',
      target: 'ProductCategory',
      inverseSide: 'products',
    },
  },
});
