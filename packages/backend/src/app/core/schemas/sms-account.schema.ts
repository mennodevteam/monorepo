import { SmsAccount } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const SmsAccountSchema = new EntitySchema<SmsAccount>({
  name: 'SmsAccount',
  target: SmsAccount,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    charge: {
      type: 'real',
      default: 0,
    },
  },
});
