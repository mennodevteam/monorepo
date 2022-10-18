import { FilterSmsTemplate, SmsTemplate } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';

@Injectable()
export class SmsTemplatesService {
  constructor(
    @InjectRepository(SmsTemplate)
    private templatesRepository: Repository<SmsTemplate>
  ) {}

  findOne(id: string): Promise<SmsTemplate> {
    return this.templatesRepository.findOneBy({ id });
  }

  findByAccount(accountId: string): Promise<SmsTemplate[]> {
    return this.templatesRepository.find({
      where: [{ id: accountId }, { account: IsNull() }],
    });
  }

  save(template: SmsTemplate): Promise<SmsTemplate> {
    return this.templatesRepository.save(template);
  }

  async delete(templateId: string): Promise<void> {
    await this.templatesRepository.delete(templateId);
  }

  filter(
    filterSmsTemplate: FilterSmsTemplate
  ): Promise<[SmsTemplate[], number]> {
    const conditions: FindOptionsWhere<SmsTemplate> = {};
    if (filterSmsTemplate.account)
      conditions.account = filterSmsTemplate.account;
    if (filterSmsTemplate.isVerified)
      conditions.isVerified = filterSmsTemplate.isVerified;

    return this.templatesRepository.findAndCount({
      where: conditions,
      take: filterSmsTemplate.take,
      skip: filterSmsTemplate.skip,
      order: { createdAt: 'DESC' },
    });
  }
}
