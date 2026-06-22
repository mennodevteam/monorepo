import { EntitySchema } from 'typeorm';
import { Stocktaking } from '@menno/types';

export const StocktakingSchema = new EntitySchema<Stocktaking>({
  name: 'Stocktaking',
  target: Stocktaking,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    date: { type: 'timestamptz' },
    description: { type: String, nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    items: {
      type: 'one-to-many',
      target: 'StocktakingItem',
      inverseSide: 'stocktaking',
      cascade: true,
    },
  },
});
