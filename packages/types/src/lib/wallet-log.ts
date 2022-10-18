import { User } from './user';
import { Wallet } from './wallet';
import { WalletLogType } from './wallet-log-type';

export class WalletLog {
  id: string;
  amount: number;
  user: User;
  type: WalletLogType;
  description: string;
  createdAt: Date;
  wallet: Wallet;
}
