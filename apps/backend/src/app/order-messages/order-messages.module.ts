import { Module } from '@nestjs/common';
import { OrderMessagesController } from './order-messages.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreModule, ScheduleModule.forRoot(), AuthModule],
  providers: [],
  controllers: [OrderMessagesController],
})
export class OrderMessagesModule {}
