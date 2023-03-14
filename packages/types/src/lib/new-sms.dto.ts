export class NewSmsDto {
  accountId: string;
  receptors?: string[];
  memberIds?: string[];
  messages?: string[];
  templateId?: string;
  templateParams?: any;
  sentAt?: Date;
}
