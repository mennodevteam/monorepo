import { EntitySchema } from 'typeorm';
import { StocktakingItem } from '@menno/types';

export const StocktakingItemSchema = new EntitySchema<StocktakingItem>({
  name: 'StocktakingItem',
  target: StocktakingItem,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    countedQuantity: { type: 'real' },
    previousStock: { type: 'real', nullable: true },
  },
  relations: {
    stocktaking: {
      type: 'many-to-one',
      target: 'Stocktaking',
      onDelete: 'CASCADE',
    },
    material: {
      type: 'many-to-one',
      target: 'Material',
      onDelete: 'CASCADE',
    },
  },
});
