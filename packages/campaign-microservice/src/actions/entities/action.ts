export class Action {
    id: string;
    label: string;
    createdAt: Date;
    userId?: string;
    campaignId: string;
    businessId?: string;
    category?: string;
    prevDistanceInSeconds?: number;
    tags: string[];
}