import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';
import { SmsService } from '../sms/sms.service';
import { DiscountsCouponController } from './discounts-coupon.controller';
import { MembersController } from './members.controller';
import { MissionsController } from './missions.controller';
import { TagsController } from './tags.controller';
import { SchemasModule } from '../core/schemas.module';

@Module({
  imports: [SchemasModule, AuthService, SmsService, ScheduleModule.forRoot()],
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
