import { Club } from './club';
import { Tag } from './tag';
import { User } from './user';
import { Wallet } from './wallet';

export class Member {
  id: string;
  publicKey: string;
  userId: string;
  user?: User;
  club: Club;
  gem: number;
  star: number;
  tags: Tag[];
  joinedAt: Date;
  description: string;
  wallet: Wallet;
  extraInfo: any;
}
