import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SmsTemplate } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class MessageTemplateService {
  constructor(private http: HttpClient) {}

  getMessageTemplates(memberId?: string): Promise<SmsTemplate[] | undefined> {
    let url = 'smsTemplates';
    if (memberId) url += `/${memberId}`;
    return this.http.get<SmsTemplate[]>(url).toPromise();
  }

  async removeMessageTemplate(messageTemplateId: string): Promise<SmsTemplate[] | undefined> {
    await this.http.delete(`smsTemplates/${messageTemplateId}`).toPromise();

    return this.getMessageTemplates();
  }

  async insertMessageTemplate(messageTemplate: SmsTemplate): Promise<SmsTemplate[] | undefined> {
    await this.http.post<SmsTemplate>('smsTemplates', messageTemplate).toPromise();

    return this.getMessageTemplates();
  }
}
