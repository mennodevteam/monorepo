import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderSubscriber } from './order.subscriber';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderConfigsService } from './order-configs.service';
import { ShopsModule } from '../shops/shops.module';
import { MenusModule } from '../menus/menus.module';
import {
  ClubMicroservice,
  NotificationMicroservice,
  SmsMicroservice,
  StockMicroservice,
  UserMicroservice,
} from '../core/microservices';
import { OrderConfigsController } from './order-configs.controller';
import { DeliveryAreasModule } from '../delivery-areas/delivery-areas.module';
import { OrderConfigSchema } from './schemas/order-config.schema';
import { OrderSchema } from './schemas/order.schema';
import { OrderItemSchema } from './schemas/order-item.schema';
import { OrderReviewSchema } from './schemas/order-review.schema';
import { ShopPrintersModule } from '../shop-printers/shop-printers.module';
import { WindowsLocalNotificationModule } from '../windows-local-notifacation/windows-local-notification.module';

@Module({
  imports: [
    ClientsModule.register([
      SmsMicroservice,
      ClubMicroservice,
      NotificationMicroservice,
      UserMicroservice,
      StockMicroservice,
    ]),
    TypeOrmModule.forFeature([
      OrderConfigSchema,
      OrderSchema,
      OrderItemSchema,
      OrderReviewSchema,
    ]),
    ShopsModule,
    MenusModule,
    DeliveryAreasModule,
    ShopPrintersModule,
    WindowsLocalNotificationModule,
  ],
  providers: [OrdersService, OrderSubscriber, OrderConfigsService],
  controllers: [
    OrdersController,
    OrderConfigsController,
    OrderConfigsController,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
