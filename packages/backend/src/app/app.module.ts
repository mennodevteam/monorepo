import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigsModule } from './app-configs/app-configs.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { SchemasModule } from './core/schemas.module';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
      autoLoadEntities: true,
    }),
    SchemasModule,
    AuthModule,
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
    AddressesModule,
    ShopPluginsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
