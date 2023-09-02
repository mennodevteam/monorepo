import { Member } from './member';

export class GemLog {
  id: number;
  member: Member;
  gem: number;
  description: string;
  createdAt?: Date;
}
