import { Sms, SmsAccount } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Repository } from 'typeorm';

@EventSubscriber()
export class SmsSubscriber implements EntitySubscriberInterface<Sms> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(SmsAccount)
    private smsAccountsRepo: Repository<SmsAccount>
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Sms;
  }

  async afterInsert(event: InsertEvent<Sms>) {
    if (event.entity.account) {
      this.smsAccountsRepo.decrement({ id: event.entity.account.id }, 'charge', event.entity.cost);
    }
  }
}
