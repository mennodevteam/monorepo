import { Wallet } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const WalletSchema = new EntitySchema<Wallet>({
  name: 'Wallet',
  target: Wallet,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    charge: {
      type: Number,
      default: 0,
    },
  },
  relations: {
    member: {
      type: 'one-to-one',
      target: 'Member',
      inverseSide: 'wallet',
    },
  },
});
