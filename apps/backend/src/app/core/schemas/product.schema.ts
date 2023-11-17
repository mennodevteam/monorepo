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
    thirdPartyId: {
      type: String,
      nullable: true,
    },
    updatedAt: {
      type: 'timestamptz',
      updateDate: true,
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
    variants: {
      type: 'one-to-many',
      target: 'ProductVariant',
      inverseSide: 'product',
      cascade: ['insert', 'update', 'soft-remove']
    }
  },
});
