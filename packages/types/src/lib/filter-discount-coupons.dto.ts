import { Member } from './member';

export class FilterDiscountCouponsDto {
  clubId: string;
  isEnabled: boolean;
  memberId: Member;
}
