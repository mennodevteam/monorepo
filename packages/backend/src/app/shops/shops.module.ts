import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { SmsModule } from '../sms/sms.module';
import { ShopSchema } from './schemas';
import { RegionSchema } from '../regions/schemas/region.schema';
import { MenuSchema } from '../menus/schemas';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShopSchema,
      RegionSchema,
      MenuSchema,
    ]),
    SmsModule,
    UsersModule,
  ],
  controllers: [ShopsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
