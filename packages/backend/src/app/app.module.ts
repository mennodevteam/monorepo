import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigsModule } from './app-configs/app-configs.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SchemasModule } from './core/schemas.module';
import { FilesModule } from './files/files.module';
import { MenusModule } from './menus/menus.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { RegionsModule } from './regions/regions.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';

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
    OrdersModule,
    PaymentsModule,
    AppConfigsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
