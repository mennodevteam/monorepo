import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { DiscountsCouponController } from './discounts-coupon.controller';
import { MembersController } from './members.controller';
import { MissionsController } from './missions.controller';
import { TagsController } from './tags.controller';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';
import { HttpModule } from '@nestjs/axios';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { OrdersSubscriber } from './orders.subscriber';
import { MissionsService } from './missions.service';

@Module({
  imports: [CoreModule, AuthModule, SmsModule, HttpModule, ScheduleModule.forRoot()],
  providers: [ClubsService, WalletsService, OrdersSubscriber, MissionsService],
  controllers: [
    ClubsController,
    WalletsController,
    DiscountsCouponController,
    MembersController,
    MissionsController,
    TagsController,
  ],
  exports: [ClubsService, WalletsService],
})
export class ClubsModule {}
