import { Module } from '@nestjs/common';
import { OrderMessagesController } from './order-messages.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { SchemasModule } from '../core/schemas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SchemasModule, ScheduleModule.forRoot(), AuthModule],
  providers: [],
  controllers: [OrderMessagesController],
})
export class OrderMessagesModule {}
