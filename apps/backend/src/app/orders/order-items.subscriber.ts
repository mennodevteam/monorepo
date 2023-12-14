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
import { OrderItem, Product, ProductVariant } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';

@EventSubscriber()
export class OrderItemsSubscriber implements EntitySubscriberInterface<OrderItem> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantsRepo: Repository<ProductVariant>
  ) {
    dataSource.subscribers.push(this);
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
  }
}
