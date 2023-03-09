import { OrderType, ProductCategory, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ProductCategorySchema = new EntitySchema<ProductCategory>({
  name: 'ProductCategory',
  target: ProductCategory,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    star: {
      type: Number,
      nullable: true,
    },
    faIcon: {
      type: String,
      nullable: true,
    },
    position: {
      type: Number,
      nullable: true,
    },
    orderTypes: {
      type: 'enum',
      enum: OrderType,
      array: true,
      default: [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
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
  },
  relations: {
    products: {
      type: 'one-to-many',
      target: 'Product',
      inverseSide: 'category',
      cascade: ['insert', 'update']
    },
    menu: {
      type: 'many-to-one',
      target: 'Menu',
      inverseSide: 'categories',
    },
  },
});
