import { ProductVariant, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ProductVariantSchema = new EntitySchema<ProductVariant>({
  name: 'ProductVariant',
  target: ProductVariant,
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
    stock: {
      type: Number,
      nullable: true,
    },
    position: {
      type: Number,
      nullable: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    price: {
      type: 'real',
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
  },
  checks: [
    {
      expression: 'stock >= 0',
    },
  ],
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
      inverseSide: 'variants',
    },
  },
});
