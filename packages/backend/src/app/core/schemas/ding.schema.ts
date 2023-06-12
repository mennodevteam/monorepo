import { Ding } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const DingSchema = new EntitySchema<Ding>({
  name: 'Ding',
  target: Ding,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    description: {
      type: String,
      nullable: true,
    },
    table: {
      type: String,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    customer: {
      type: 'many-to-one',
      target: 'User',
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
