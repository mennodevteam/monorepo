import { BasalamProduct } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const BasalamProductSchema = new EntitySchema<BasalamProduct>({
  name: 'BasalamProduct',
  target: BasalamProduct,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    sync: {
      type: 'simple-json',
      nullable: true,
    },
    updatedAt: {
      type: 'timestamptz',
      nullable: true,
    },
    syncedAt: {
      type: 'timestamptz',
      nullable: true,
    },
  },
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
