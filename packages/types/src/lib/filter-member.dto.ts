export class FilterMemberDto {
  clubId: string;
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