import { Club } from "./club";
import { Member } from "./member";


export class FilterDiscountCouponsDto {
    clubId: Club;
    isEnabled: boolean;
    memberId: Member;
}