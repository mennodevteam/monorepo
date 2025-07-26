import { Module } from '@nestjs/common';
import { AiChatbotController } from './ai-chatbot.controller';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { AiChatbotService } from './ai-chatbot.service';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
})
export class AiChatbotModule {} 