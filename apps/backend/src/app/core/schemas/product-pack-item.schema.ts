import { ProductPackItem } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ProductPackItemSchema = new EntitySchema<ProductPackItem>({
  name: 'ProductPackItem',
  target: ProductPackItem,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    quantity: {
      type: 'real',
      default: 1,
    },
  },
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
      onDelete: 'CASCADE',
    },
    variant: {
      type: 'many-to-one',
      target: 'ProductVariant',
      onDelete: 'CASCADE',
      nullable: true,
    },
    parentProduct: {
      type: 'many-to-one',
      target: 'Product',
      inverseSide: 'packItems',
      onDelete: 'CASCADE',
      nullable: true,
    },
    parentVariant: {
      type: 'many-to-one',
      target: 'ProductVariant',
      inverseSide: 'packItems',
      onDelete: 'CASCADE',
      nullable: true,
    },
  },
});
