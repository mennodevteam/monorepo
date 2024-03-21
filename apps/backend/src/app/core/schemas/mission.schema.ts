import { Mission, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MissionSchema = new EntitySchema<Mission>({
  name: 'Mission',
  target: Mission,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
      nullable: true,
    },
    reward: {
      type: 'simple-json',
    },
    condition: {
      type: 'simple-json',
      default: {},
    },
    startedAt: {
      type: 'timestamptz',
      nullable: true,
    },
    expiredAt: {
      type: 'timestamptz',
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    description: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    club: {
      type: 'many-to-one',
      target: 'Club',
    },
  },
});
