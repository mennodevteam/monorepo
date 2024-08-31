import { Region } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const RegionSchema = new EntitySchema<Region>({
  name: 'Region',
  target: Region,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
    },
    state: {
      type: String,
      nullable: true,
    },
    latitude: {
      type: 'decimal',
      nullable: true,
    },
    longitude: {
      type: 'decimal',
      nullable: true,
    },
    timezone: {
      type: String,
      nullable: true,
    },
  },
});
