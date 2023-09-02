import { SmsAccount } from "./sms-account";
import { SmsStatus } from "./sms-status.enum";

export class Sms {
    id: string;
    kavenegarId?: string;
    message: string;
    account: SmsAccount;
    receptor: string;
    cost: number;
    status: SmsStatus;
    statusDescription: string;
    sentAt?: Date;
    createdAt: Date;
}