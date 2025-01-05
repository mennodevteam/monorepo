import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AppConfigSchema,
  AddressSchema,
  ClubSchema,
  DingSchema,
  DiscountCouponSchema,
  GemLogSchema,
  MemberSchema,
  MemberTagSchema,
  MenuCostSchema,
  MenuSchema,
  MenuStatSchema,
  MissionCompleteSchema,
  MissionSchema,
  ProductCategorySchema,
  ProductSchema,
  ProductVariantSchema,
  RegionSchema,
  ShopGroupSchema,
  OrderItemSchema,
  OrderMessageSchema,
  OrderReviewSchema,
  OrderSchema,
  OrderCustomerMessageSchema,
  ShopSchema,
  PrintActionSchema,
  ShopPrintViewSchema,
  ShopPrinterSchema,
  ShopPluginsSchema,
  DeliveryAreaSchema,
  ThirdPartySchema,
  ShopUserSchema,
  PaymentGatewaySchema,
  PaymentTokenSchema,
  PaymentSchema,
  SmsAccountSchema,
  SmsGroupSchema,
  SmsSchema,
  SmsTemplateSchema,
  ThemeSchema,
  UserSchema,
  WalletLogSchema,
  WalletSchema,
  WebPushSubscriptionSchema,
  WindowsLocalNotificationSchema,
  BasalamOAuthSchema,
  BasalamProductSchema,
} from './schemas';
import { RedisService } from './redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppConfigSchema,
      AddressSchema,
      BasalamOAuthSchema,
      BasalamProductSchema,
      ClubSchema,
      DingSchema,
      DiscountCouponSchema,
      GemLogSchema,
      MemberTagSchema,
      MemberSchema,
      MenuCostSchema,
      MenuSchema,
      MenuStatSchema,
      MissionCompleteSchema,
      MissionSchema,
      ProductCategorySchema,
      ProductSchema,
      ProductVariantSchema,
      RegionSchema,
      ShopGroupSchema,
      OrderItemSchema,
      OrderMessageSchema,
      OrderReviewSchema,
      OrderSchema,
      OrderCustomerMessageSchema,
      ShopUserSchema,
      PaymentGatewaySchema,
      PaymentTokenSchema,
      PaymentSchema,
      ShopSchema,
      PrintActionSchema,
      ShopPrintViewSchema,
      ShopPrinterSchema,
      ShopPluginsSchema,
      DeliveryAreaSchema,
      ThirdPartySchema,
      SmsAccountSchema,
      SmsGroupSchema,
      SmsTemplateSchema,
      SmsSchema,
      ThemeSchema,
      UserSchema,
      WalletLogSchema,
      WalletSchema,
      WebPushSubscriptionSchema,
      WindowsLocalNotificationSchema,
    ]),
  ],
  providers: [RedisService],
  exports: [TypeOrmModule, RedisService],
})
export class CoreModule {}
