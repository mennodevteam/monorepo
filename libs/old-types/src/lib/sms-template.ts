import { SmsAccount } from "./sms-account";

export class SmsTemplate {
    id: string;
    account?: SmsAccount;
    creatorId?: string;
    message: string;
    isVerified?: boolean;
    responseText?: string;
    title: string;
    createdAt: Date;
}