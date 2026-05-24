import { Injectable } from '@nestjs/common';
import { DataSource, EntitySubscriberInterface, EventSubscriber, TransactionCommitEvent } from 'typeorm';
import { MennoBaleOrderNotificationsService } from './menno-bale-order-notifications.service';

@EventSubscriber()
@Injectable()
export class MennoBaleTransactionSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly mennoBaleOrderNotifications: MennoBaleOrderNotificationsService,
  ) {
    dataSource.subscribers.push(this);
  }

  afterTransactionCommit(event: TransactionCommitEvent): void {
    this.mennoBaleOrderNotifications.flushPendingSyncs(event.queryRunner);
  }
}
