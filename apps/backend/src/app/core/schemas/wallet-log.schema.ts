import { WalletLog, WalletLogType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const WalletLogSchema = new EntitySchema<WalletLog>({
  name: 'WalletLog',
  target: WalletLog,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    amount: {
      type: Number,
    },
    type: {
      type: 'enum',
      enum: WalletLogType,
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
    user: {
      type: 'many-to-one',
      target: 'User',
    },
    wallet: {
      type: 'many-to-one',
      target: 'Wallet',
    },
  },
});
