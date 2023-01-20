import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AppConfigSchema,
  ClubSchema,
  DiscountCouponSchema,
  DiscountUsageSchema,
  GemLogSchema,
  MemberSchema,
  MemberTagSchema,
  MenuCostSchema,
  MenuSchema,
  MissionCompleteSchema,
  MissionSchema,
  ProductCategorySchema,
  ProductSchema,
  PurchaseSchema,
  RegionSchema,
  ShopGroupSchema,
  OrderItemSchema,
  OrderReviewSchema,
  OrderSchema,
  ShopSchema,
  ShopUserSchema,
  SmsAccountSchema,
  SmsSchema,
  SmsTemplateSchema,
  ThemeSchema,
  UserSchema,
  WalletLogSchema,
  WalletSchema,
} from './schemas';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppConfigSchema,
      ClubSchema,
      DiscountCouponSchema,
      DiscountUsageSchema,
      GemLogSchema,
      MemberTagSchema,
      MemberSchema,
      MenuCostSchema,
      MenuSchema,
      MissionCompleteSchema,
      MissionSchema,
      ProductCategorySchema,
      ProductSchema,
      PurchaseSchema,
      RegionSchema,
      ShopGroupSchema,
      OrderItemSchema,
      OrderReviewSchema,
      OrderSchema,
      ShopUserSchema,
      ShopSchema,
      SmsAccountSchema,
      SmsTemplateSchema,
      SmsSchema,
      ThemeSchema,
      UserSchema,
      WalletLogSchema,
      WalletSchema,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class SchemasModule {}
