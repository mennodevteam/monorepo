import { EntitySchema } from 'typeorm';
import { BillOfMaterial } from '@menno/types';

export const BillOfMaterialSchema = new EntitySchema<BillOfMaterial>({
  name: 'BillOfMaterial',
  target: BillOfMaterial,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    quantity: { type: Number },
  },
  relations: {
    material: {
      type: 'many-to-one',
      target: 'Material',
      inverseSide: 'boms',
      onDelete: 'CASCADE',
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
  },
});
