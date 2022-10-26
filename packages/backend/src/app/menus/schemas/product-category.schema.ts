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
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    star: {
      type: Number,
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
    },
    menu: {
      type: 'many-to-one',
      target: 'Menu',
      inverseSide: 'categories',
    },
  },
});
