import { Member, Order, Shop } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Repository } from 'typeorm';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>) {
    const order = event.entity;

    const shop = order.shop
      ? await this.shopsRepo.findOne({ where: { id: order.shop.id }, relations: ['club'] })
      : undefined;

    if (order.customer && shop && shop.club) {
      const member = await this.membersRepo.findOne({
        where: {
          club: { id: shop.club.id },
          user: { id: order.customer.id },
        },
        withDeleted: true,
      });

      if (!member) {
        this.membersRepo.save({
          club: { id: shop.club.id },
          user: { id: order.customer.id },
        });
      }
    }
  }
}
