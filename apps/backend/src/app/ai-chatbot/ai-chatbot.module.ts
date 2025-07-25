import { Module } from '@nestjs/common';
import { AiChatbotController } from './ai-chatbot.controller';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [AiChatbotController],
})
export class AiChatbotModule {} 