export class NewSmsDto {
    accountId: string;
    receptors: string[];
    messages?: string[];
    templateId?: string;
    templateParams?: any;
}