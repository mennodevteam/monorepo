import { AiChat, AiChatbot, AiChatMessage, Shop, User, UserRole } from '@menno/types';
import { Body, Controller, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { AiChatbotService } from './ai-chatbot.service';

@Controller('ai-chatbot')
export class AiChatbotController {
  constructor(
    @InjectRepository(AiChatbot)
    private aiChatbotRepo: Repository<AiChatbot>,
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(AiChat)
    private aiChatRepo: Repository<AiChat>,
    private auth: AuthService,
    private aiChatbotService: AiChatbotService,
  ) {}

  @Get('chat/:chatId')
  @Roles(UserRole.App, UserRole.Panel)
  async getChat(@Param('chatId') chatId: number, @LoginUser() user: AuthPayload): Promise<AiChat> {
    return this.aiChatRepo.findOne({ where: { id: chatId }, relations: ['messages'] });
  }

  @Post('chat')
  @Roles(UserRole.App, UserRole.Panel)
  async chat(
    @Body() body: { message: string; chatId?: number; shopId: string },
    @LoginUser() user: AuthPayload,
  ): Promise<AiChatMessage> {
    const shop = await this.shopRepo.findOne({ where: { id: body.shopId }, relations: ['aiChatbot'] });

    if (!shop.aiChatbot) {
      throw new NotFoundException('AI chatbot not found');
    }

    const text = await this.aiChatbotService.chat(shop.id, user.id, body.message, body.chatId);
    return { message: text, isFromUser: false } as AiChatMessage;
  }

  @Get()
  @Roles(UserRole.Panel)
  async getAiChatbot(@LoginUser() user: AuthPayload): Promise<AiChatbot | null> {
    // Get the shop associated with the panel user
    const shop = await this.auth.getPanelUserShop(user, ['aiChatbot']);
    return shop.aiChatbot || null;
  }

  @Put()
  @Roles(UserRole.Panel)
  async updateAiChatbot(
    @Body() aiChatbot: Partial<AiChatbot>,
    @LoginUser() user: AuthPayload,
  ): Promise<AiChatbot> {
    // Get the shop associated with the panel user
    const shop = await this.auth.getPanelUserShop(user, ['aiChatbot', 'smsAccount']);

    // Find existing AI chatbot for the shop
    const existingAiChatbot = shop.aiChatbot;

    if (existingAiChatbot) {
      // Update existing AI chatbot
      await this.aiChatbotRepo.update(existingAiChatbot.id, aiChatbot);
      return this.aiChatbotRepo.findOne({ where: { id: existingAiChatbot.id } });
    } else {
      // Create new AI chatbot
      const newAiChatbot = this.aiChatbotRepo.create({
        ...aiChatbot,
        smsAccount: shop.smsAccount,
        status: aiChatbot.status || 1, // Default status
      });

      const savedAiChatbot = await this.aiChatbotRepo.save(newAiChatbot);

      // Update shop with the new AI chatbot
      await this.shopRepo.update(shop.id, { aiChatbot: savedAiChatbot });

      return savedAiChatbot;
    }
  }
}
