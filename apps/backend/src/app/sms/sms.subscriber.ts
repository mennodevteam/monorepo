import { Sms, SmsAccount, SmsStatus } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class SmsSubscriber implements EntitySubscriberInterface<Sms> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(SmsAccount)
    private smsAccountsRepo: Repository<SmsAccount>,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Sms;
  }

  async afterInsert(event: InsertEvent<Sms>) {
    // Charge deduction is handled in bulk upfront/callback in SmsService.
  }

  async afterUpdate(event: UpdateEvent<Sms>) {
    // Refund logic is disabled.
  }
}
