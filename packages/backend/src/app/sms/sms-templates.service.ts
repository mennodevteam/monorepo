import { NewSmsDto, SmsTemplate } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from './sms.service';

@Injectable()
export class SmsTemplatesService {
  constructor(
    @InjectRepository(SmsTemplate)
    private smsTemplatesRepo: Repository<SmsTemplate>,
    private smsService: SmsService
  ) {}

  async createSmsTemplateFromPanel(smsTemplate: SmsTemplate): Promise<SmsTemplate> {
    smsTemplate.isVerified = false;

    const savedTemplate = await this.smsTemplatesRepo.save(smsTemplate);

    if (savedTemplate && savedTemplate.id && process.env.ADMIN_PHONE_NUMBERS) {
      try {
        const newTemplateSmsToAdmin = new NewSmsDto();
        newTemplateSmsToAdmin.messages = [
          `یک الگوی جدید:\n\n${smsTemplate.message} \n\n${process.env.API_URL}/messageTemplates/verify/${savedTemplate.id}`,
        ];
        newTemplateSmsToAdmin.receptors = process.env.ADMIN_PHONE_NUMBERS.split(',');
        this.smsService.send(newTemplateSmsToAdmin);
      } catch (error) {}
    }
    return savedTemplate;
  }
}
