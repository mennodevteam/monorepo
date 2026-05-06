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
    if (!event.entity?.account) {
      return;
    }

    await this.smsAccountsRepo.decrement({ id: event.entity.account.id }, 'charge', event.entity.cost);

    // If provider returns failed right away, refund immediately.
    if (event.entity.status === SmsStatus.Failed) {
      await this.smsAccountsRepo.increment({ id: event.entity.account.id }, 'charge', event.entity.cost);
    }
  }

  async afterUpdate(event: UpdateEvent<Sms>) {
    const newEntity = event.entity as Sms | undefined;
    const oldEntity = event.databaseEntity as Sms | undefined;

    if (!newEntity || !oldEntity) {
      return;
    }

    const wasFailed = oldEntity.status === SmsStatus.Failed;
    const isFailed = newEntity.status === SmsStatus.Failed;

    // Refund only on transition to failed to avoid double refunds.
    if (!wasFailed && isFailed) {
      let accountId = newEntity.account?.id || oldEntity.account?.id;
      if (!accountId && newEntity.id) {
        const sms = await event.manager.getRepository(Sms).findOne({
          where: { id: newEntity.id },
          relations: ['account'],
        });
        accountId = sms?.account?.id;
      }
      if (accountId) {
        await this.smsAccountsRepo.increment({ id: accountId }, 'charge', newEntity.cost);
      }
    }
  }
}
