import { forwardRef, Module } from '@nestjs/common';
import { AiChatbotController } from './ai-chatbot.controller';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { AiChatbotService } from './ai-chatbot.service';
import { ThirdPartiesModule } from '../third-parties/third-parties.module';

@Module({
  imports: [CoreModule, AuthModule, forwardRef(() => ThirdPartiesModule)],
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
  exports: [AiChatbotService],
})
export class AiChatbotModule {} 