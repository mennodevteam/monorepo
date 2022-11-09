import { GemLog } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const GemLogSchema = new EntitySchema<GemLog>({
  name: 'GemLog',
  target: GemLog,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    gem: {
      type: Number,
      nullable: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    member: {
      type: 'many-to-one',
      target: 'Member',
    },
  },
});
