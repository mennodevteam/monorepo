export class FilterSmsDto {
  accountId?: string;
  receptor?: string;
  query?: string;
  fromDate?: Date;
  toDate?: Date;
  skip?: number;
  take?: number;
}
