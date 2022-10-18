import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SmsSchema } from './schemas/sms.schema';
import { SmsTemplateSchema } from './schemas/sms-template.schema';
import { SmsAccountSchema } from './schemas/sms-account.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsSchema, SmsTemplateSchema, SmsAccountSchema]),
    ScheduleModule.forRoot(),
  ],
  providers: [],
  controllers: [],
})
export class SmsModule {}
