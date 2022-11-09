import { Member } from './member';
import { Mission } from './mission';

export class MissionComplete {
  id: number;
  mission: Mission;
  member: Member;
  createdAt: Date;
}
