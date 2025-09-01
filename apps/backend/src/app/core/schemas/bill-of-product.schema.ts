import { EntitySchema } from 'typeorm';
import { BillOfMaterial, BillOfProduct } from '@menno/types';

export const BillOfProductSchema = new EntitySchema<BillOfProduct>({
  name: 'BillOfProduct',
  target: BillOfMaterial,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    quantity: { type: 'real', default: 1 },
  },
  relations: {
    productSource: {
      type: 'many-to-one',
      target: 'Material',
      inverseSide: 'boms',
      onDelete: 'CASCADE',
    },
    variantSource: {
      type: 'many-to-one',
      target: 'ProductVariant',
      inverseSide: 'boms',
      onDelete: 'CASCADE',
      nullable: true,
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
      inverseSide: 'boms',
      nullable: true,
      onDelete: 'CASCADE',
    },
    variant: {
      type: 'many-to-one',
      target: 'ProductVariant',
      inverseSide: 'boms',
      nullable: true,
      onDelete: 'CASCADE',
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
