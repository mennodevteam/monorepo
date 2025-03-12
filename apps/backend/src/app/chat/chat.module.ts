import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [CoreModule, ScheduleModule.forRoot(), AuthModule, SmsModule],
  providers: [],
  controllers: [ChatController],
})
export class ChatModule {}
