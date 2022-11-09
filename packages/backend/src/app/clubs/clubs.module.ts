import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import {
  ClubSchema,
  DiscountCouponSchema,
  DiscountUsageSchema,
  GemLogSchema,
  MemberSchema,
  MemberTagSchema,
  MissionCompleteSchema,
  MissionSchema,
  PurchaseSchema,
  WalletLogSchema,
  WalletSchema,
} from './schemas';
import { AuthService } from '../auth/auth.service';
import { SmsService } from '../sms/sms.service';
import { DiscountsCouponController } from './discounts-coupon.controller';
import { MembersController } from './members.controller';
import { MissionsController } from './missions.controller';
import { TagsController } from './tags.controller';

@Module({
  imports: [
    AuthService,
    SmsService,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      ClubSchema,
      DiscountCouponSchema,
      DiscountUsageSchema,
      GemLogSchema,
      MemberTagSchema,
      MissionSchema,
      PurchaseSchema,
      MemberSchema,
      MissionCompleteSchema,
      WalletLogSchema,
      WalletSchema,
    ]),
  ],
  providers: [ClubsService],
  controllers: [
    ClubsController,
    DiscountsCouponController,
    MembersController,
    MissionsController,
    TagsController,
  ],
  exports: [ClubsService],
})
export class ClubsModule {}
