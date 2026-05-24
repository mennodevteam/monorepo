import { forwardRef, Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ThirdPartiesController } from './third-parties.controller';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { BaleBotsService } from './bale-bots.service';
import { BaleWebhookController } from './bale-webhook.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member, Order, OrderItem, Shop, User } from '@menno/types';
import { MennoBaleOrderNotificationsService } from './menno-bale-order-notifications.service';
import { MennoBaleTransactionSubscriber } from './menno-bale-transaction.subscriber';
import { AiChatbotModule } from '../ai-chatbot/ai-chatbot.module';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    HttpModule,
    TypeOrmModule.forFeature([Shop, User, Order, OrderItem, Member]),
    forwardRef(() => AiChatbotModule),
  ],
  controllers: [ThirdPartiesController, BaleWebhookController],
  providers: [BaleBotsService, MennoBaleOrderNotificationsService, MennoBaleTransactionSubscriber],
  exports: [BaleBotsService, MennoBaleOrderNotificationsService],
})
export class ThirdPartiesModule {}
