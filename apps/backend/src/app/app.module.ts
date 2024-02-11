import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigsModule } from './app-configs/app-configs.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { CoreModule } from './core/core.module';
import { DeliveryAreasModule } from './delivery-areas/delivery-areas.module';
import { FilesModule } from './files/files.module';
import { MenusModule } from './menus/menus.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrintersModule } from './printers/printers.module';
import { RegionsModule } from './regions/regions.module';
import { ShopsModule } from './shops/shops.module';
import { SmsModule } from './sms/sms.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { ShopPluginsModule } from './shop-plugins/shop-plugins.module';
import { HttpModule } from '@nestjs/axios';
import { ThirdPartiesModule } from './third-parties/third-parties.module';
import { WebPushNotificationModule } from './web-push-notifications/web-push-notifications.module';
import { DingModule } from './ding/ding.module';
import { OrderMessagesModule } from './order-messages/order-messages.module';
import { WindowsLocalNotificationModule } from './windows-local-notifacation/windows-local-notification.module';
import { AppRedirectController } from './app-redirect.controller';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './core/http-exception.filter';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
      keepConnectionAlive: true,
      autoLoadEntities: true,

      extra: {
        extensions: ['pg_stat_statements'],
        pool: {
          max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
          min: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MIN) : 2,
          acquire: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_ACQUIRE) : 30000,
          idle: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_IDLE) : 10000,
        },
      },
      connectTimeoutMS: 5000,
      poolSize: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
      poolErrorHandler: (error: any) => {
        console.error('pool error handler', error);
      },
    }),
    HealthModule,
    CoreModule,
    HttpModule,
    AuthModule,
    DashboardModule,
    UsersModule,
    ShopsModule,
    MenusModule,
    FilesModule,
    RegionsModule,
    ClubsModule,
    PrintersModule,
    SmsModule,
    OrdersModule,
    PaymentsModule,
    AppConfigsModule,
    DeliveryAreasModule,
    OrderMessagesModule,
    AddressesModule,
    ShopPluginsModule,
    ThirdPartiesModule,
    WebPushNotificationModule,
    DingModule,
    WindowsLocalNotificationModule,
  ],
  controllers: [AppController, AppRedirectController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
