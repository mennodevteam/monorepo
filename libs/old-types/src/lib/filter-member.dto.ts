export class FilterMemberDto {
    fromDate?: Date;
    toDate?: Date;
    skip?: number;
    take?: number;
    query?: string;
    tagIds?: string[];
    sortBy?: string;
    fromStar?: number;
    toStar?: number;
    mobilePhone?: string;
    userId?: string;
    publicKey?: string;
}