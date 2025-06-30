import { EntitySchema } from 'typeorm';
import { Material, MaterialUnit } from '@menno/types';

export const MaterialSchema = new EntitySchema<Material>({
  name: 'Material',
  target: Material,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: String },
    stock: { type: Number },
    unit: { type: 'enum', enum: MaterialUnit },
    averageCost: { type: Number, nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    boms: {
      type: 'one-to-many',
      target: 'BillOfMaterial',
      inverseSide: 'material',
    },
  },
});
