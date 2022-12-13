import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SmsTemplate } from '@menno/types';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageTemplateService {
  constructor(private http: HttpClient, private titleService: Title) {}

  getMessageTemplates(memberId?: string): Promise<SmsTemplate[]> {
    let url = 'messageTemplates';
    if (memberId) url += `/${memberId}`;
    return this.http.get<SmsTemplate[]>(url).toPromise();
  }

  async removeMessageTemplate(
    messageTemplateId: string
  ): Promise<SmsTemplate[]> {
    await this.http.delete(`messageTemplates/${messageTemplateId}`).toPromise();

    return this.getMessageTemplates();
  }

  async insertMessageTemplate(
    messageTemplate: SmsTemplate
  ): Promise<SmsTemplate[]> {
    await this.http
      .post<SmsTemplate>('messageTemplates', messageTemplate)
      .toPromise();

    return this.getMessageTemplates();
  }
}
