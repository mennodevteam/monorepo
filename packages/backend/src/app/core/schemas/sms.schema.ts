import { Sms, SmsStatus } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const SmsSchema = new EntitySchema<Sms>({
  name: 'Sms',
  target: Sms,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    kavenegarId: {
      type: String,
    },
    message: {
      type: String,
    },
    cost: {
      type: 'real',
    },
    receptor: {
      type: String,
    },
    status: {
      type: 'enum',
      enum: SmsStatus,
    },
    sentAt: {
      type: 'timestamptz',
      nullable: true,
    },
    statusDescription: {
      type: String,
      nullable: true,
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
  },
});
