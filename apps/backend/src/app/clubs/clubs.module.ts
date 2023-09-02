import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { DiscountsCouponController } from './discounts-coupon.controller';
import { MembersController } from './members.controller';
import { MissionsController } from './missions.controller';
import { TagsController } from './tags.controller';
import { SchemasModule } from '../core/schemas.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SchemasModule, AuthModule, SmsModule, HttpModule, ScheduleModule.forRoot()],
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
