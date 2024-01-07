import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { SmsSubscriber } from './sms.subscriber';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { SmsAccountsController } from './sms-accounts.controller';
import { SmsTemplatesController } from './sms-templates.controller';
import { SmsTemplatesService } from './sms-templates.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule, AuthModule, ScheduleModule.forRoot()],
  providers: [SmsService, SmsSubscriber, SmsTemplatesService],
  controllers: [SmsController, SmsAccountsController, SmsTemplatesController],
  exports: [SmsService],
})
export class SmsModule {}
