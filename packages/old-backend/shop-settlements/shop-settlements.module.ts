import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopsModule } from '../shops/shops.module';
import { ShopBankInfoSchema } from './schema/shop-bankInfo.schema';
import { ShopSettlementSchema } from './schema/shop-settlement.schema';
import { ShopBankInfoController } from './shop-bank-info.controller';
import { ShopBankInfoService } from './shop-bank-info.service';
import { ShopSettlementsController } from './shop-settlements.controller';
import { ShopSettlementsService } from './shop-settlements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopSettlementSchema, ShopBankInfoSchema]),
    ShopsModule,
  ],
  providers: [ShopSettlementsService, ShopBankInfoService],
  controllers: [ShopSettlementsController, ShopBankInfoController],
})
export class ShopSettlementsModule {}
