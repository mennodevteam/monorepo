import { Club } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ClubSchema = new EntitySchema<Club>({
  name: 'Club',
  target: Club,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    config: {
      type: 'simple-json',
      default: {},
    },
  },
  relations: {
    smsAccount: {
      type: 'many-to-one',
      target: 'SmsAccount',
      nullable: true,
    },
  },
});
