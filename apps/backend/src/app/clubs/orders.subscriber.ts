import { Order, OrderPaymentType, Shop } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';
import { MissionsService } from './missions.service';

@EventSubscriber()
export class OrdersSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    dataSource: DataSource,
    private missionsService: MissionsService,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>) {
    try {
      const order = event.entity;
      const rawId = event.entityId;
      const generatedId =
        typeof rawId === 'string'
          ? rawId
          : rawId && typeof rawId === 'object' && 'id' in rawId && typeof (rawId as { id: unknown }).id === 'string'
            ? (rawId as { id: string }).id
            : undefined;
      if (generatedId && !order.id) Object.assign(order, { id: generatedId });
      if (order.paymentType) void this.missionsService.checkFormMission(order).catch(() => undefined);
    } catch (error) {
      // unhandled
    }
  }

  async afterUpdate(event: UpdateEvent<Order>): Promise<any> {
    try {
      const entityId = event.entity?.id;
      if (!entityId) return;

      const order = {
        ...(await this.ordersRepo.findOne({ where: { id: entityId }, relations: ['shop', 'customer'] })),
        ...event.entity,
      };
      if (event.entity.paymentType)
        void this.missionsService.checkFormMission(order).catch(() => undefined);
    } catch (error) {
      // unhandled
    }
  }
}
