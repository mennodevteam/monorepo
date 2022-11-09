import { Club } from './club';
import { MemberTag } from './member-tag';
import { User } from './user';
import { Wallet } from './wallet';

export class Member {
  id: string;
  publicKey: string;
  user: User;
  club: Club;
  gem: number;
  star: number;
  tags: MemberTag[];
  joinedAt: Date;
  description: string;
  wallet: Wallet;
  extraInfo: any;
  deletedAt: Date;
}
