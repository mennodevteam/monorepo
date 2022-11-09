import { MissionComplete } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MissionCompleteSchema = new EntitySchema<MissionComplete>({
  name: 'MissionComplete',
  target: MissionComplete,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    mission: {
      type: 'many-to-one',
      target: 'Mission',
    },
    member: {
      type: 'many-to-one',
      target: 'Member',
    },
  },
});
