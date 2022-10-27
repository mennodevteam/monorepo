import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsSubscriber } from './sms.subscriber';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { SmsAccountSchema, SmsSchema, SmsTemplateSchema } from './schemas';
import { SmsAccountsController } from './sms-accounts.controller';
import { SmsTemplatesController } from './sms-templates.controller';
import { SmsTemplatesService } from './sms-templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsSchema, SmsAccountSchema, SmsTemplateSchema]),
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  providers: [SmsService, SmsSubscriber, SmsTemplatesService],
  controllers: [SmsController, SmsAccountsController, SmsTemplatesController],
  exports: [SmsService]
})
export class SmsModule {}
