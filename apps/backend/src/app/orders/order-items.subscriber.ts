import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  Repository,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { OrderItem, Product, ProductVariant } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import { MennoBaleOrderNotificationsService } from '../third-parties/menno-bale-order-notifications.service';

@EventSubscriber()
export class OrderItemsSubscriber implements EntitySubscriberInterface<OrderItem> {
  private readonly logger = new Logger(OrderItemsSubscriber.name);

  constructor(
    dataSource: DataSource,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantsRepo: Repository<ProductVariant>,
    private mennoBaleOrderNotifications: MennoBaleOrderNotificationsService,
  ) {
    dataSource.subscribers.push(this);
  }

  private scheduleMennoFromItem(item?: OrderItem | null, reason?: string) {
    if (!item) return;
    const row = item as OrderItem & { orderId?: string };
    const oid = row.order?.id ?? row.orderId;
    if (oid) {
      this.logger.debug(`Menno Bale from orderItem order=${oid} item=${row.id ?? '?'} reason=${reason ?? 'unknown'} allowCreate=false`);
      this.mennoBaleOrderNotifications.scheduleSyncOrderChannelMessage(oid, false);
    } else {
      this.logger.debug(`Menno Bale from orderItem skip: no order id (reason=${reason ?? 'unknown'})`);
    }
  }

  listenTo() {
    return OrderItem;
  }

  async afterInsert(event: InsertEvent<OrderItem>) {
    try {
      if (event.entity.productVariant) {
        const productVariant = await this.productVariantsRepo.findOneBy({
          id: event.entity.productVariant.id,
        });
        await this.productVariantsRepo.decrement(
          { id: productVariant.id },
          'stock',
          Math.min(event.entity.quantity, productVariant.stock)
        );
      } else if (event.entity.product) {
        const product = await this.productsRepo.findOneBy({ id: event.entity.product.id });
        await this.productsRepo.decrement(
          { id: product.id },
          'stock',
          Math.min(event.entity.quantity, product.stock)
        );
      }
    } catch (error) {
      // do nothing
    }
    try {
      this.scheduleMennoFromItem(event.entity, 'afterInsert');
    } catch (error) {
      // do nothing
    }
  }

  async afterRemove(event: RemoveEvent<OrderItem>) {
    try {
      const item = await this.orderItemsRepo.findOne({
        where: { id: event.entityId },
        relations: ['product', 'productVariant'],
      });
      if (item.productVariant && item.productVariant.stock != undefined) {
        await this.productVariantsRepo.increment({ id: item.productVariant.id }, 'stock', item.quantity);
      } else if (item.product && item.product.stock != undefined) {
        await this.productsRepo.increment({ id: item.product.id }, 'stock', item.quantity);
      }
    } catch (error) {
      // do nothing
    }
    try {
      this.scheduleMennoFromItem(event.entity as OrderItem | undefined, 'afterRemove');
    } catch (error) {
      // do nothing
    }
  }

  async afterSoftRemove(event: SoftRemoveEvent<OrderItem>) {
    try {
      const item = await this.orderItemsRepo.findOne({
        where: { id: event.entity.id },
        relations: ['product', 'productVariant'],
      });
      if (item.productVariant && item.productVariant.stock != undefined) {
        await this.productVariantsRepo.increment({ id: item.productVariant.id }, 'stock', item.quantity);
      } else if (item.product && item.product.stock != undefined) {
        await this.productsRepo.increment({ id: item.product.id }, 'stock', item.quantity);
      }
    } catch (error) {
      // do nothing
    }
    try {
      this.scheduleMennoFromItem(event.entity, 'afterSoftRemove');
    } catch (error) {
      // do nothing
    }
  }
}
