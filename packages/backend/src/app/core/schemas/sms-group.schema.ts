import { SmsGroup } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const SmsGroupSchema = new EntitySchema<SmsGroup>({
  name: 'SmsGroup',
  target: SmsGroup,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    message: {
      type: String,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    account: {
      type: 'many-to-one',
      target: 'SmsAccount',
    },
    list: {
      type: 'one-to-many',
      target: 'Sms',
      inverseSide: 'group',
    },
  },
});
