import { Member } from "./member";

export class FilterMemberDto {
  clubId?: string;
  fromDate?: Date;
  wallet?: number
  toDate?: Date;
  skip?: number;
  take?: number;
  query?: string;
  fromStar?: number;
  toStar?: number;
  tagIds?: string[];
  sortBy?: 'mobilePhone' | 'star' | 'joinedAt' | 'credit' | 'gem';
  sortType?: 'DESC' | 'ASC';
  mobilePhone?: string;
  userId?: string;
  publicKey?: string;
}

export class FilterMemberV2Dto {
  firstOrderFromDate?: Date;
  firstOrderToDate?: Date;
  lastOrderFromDate?: Date;
  lastOrderToDate?: Date;
  joinedAtFromDate?: Date;
  joinedAtToDate?: Date;
  lastVisitFromDate?: Date;
  lastVisitToDate?: Date;
  fromStar?: number;
  toStar?: number;
  sortBy?: 'firstOrder' | 'lastOrder' | 'joinedAt' | 'lastVisit' | 'totalOrderCount' | 'totalOrderSum' | 'star';
  sortType?: 'ASC' | 'DESC';
  skip?: number;
  take?: number;
}

export class FilterMemberV2ResponseDto {
  member: Member; // Should be Member, but use any for now to avoid import issues
  joinedAt: Date;
  firstOrderTime: Date | null;
  lastOrderTime: Date | null;
  totalOrderCount: number;
  totalOrderSum: number;
  lastVisitDate: Date | null;
}