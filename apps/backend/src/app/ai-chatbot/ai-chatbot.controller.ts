import { AiChat, AiChatbot, AiChatMessage, Shop, User, UserRole } from '@menno/types';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
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

  @Get('panel/chats')
  @Roles(UserRole.Panel)
  async panelChats(
    @LoginUser() user: AuthPayload,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const shop = await this.auth.getPanelUserShop(user);
    const page = Math.max(Math.floor(Number(pageStr)) || 1, 1);
    const limit = Math.floor(Number(limitStr)) || 20;
    return this.aiChatbotService.listPanelChatsPaged(shop.id, page, limit);
  }

  @Get('chat/:chatId')
  @Roles(UserRole.App, UserRole.Panel)
  async getChat(@Param('chatId') chatId: number): Promise<AiChat> {
    return this.aiChatRepo.findOne({ where: { id: chatId }, relations: ['messages'] });
  }

  @Post('chat')
  @Roles(UserRole.App, UserRole.Panel)
  async chat(
    @Body() body: { message: string; chatId?: number; shopId: string },
    @LoginUser() user: AuthPayload,
  ): Promise<Pick<AiChatMessage, 'botMessage'> & { productIds: string[] }> {
    const shop = await this.shopRepo.findOne({ where: { id: body.shopId }, relations: ['aiChatbot'] });

    if (!shop?.aiChatbot) {
      throw new NotFoundException('AI chatbot not found');
    }

    const result = await this.aiChatbotService.chat(shop.id, user.id, body.message, body.chatId);
    return { botMessage: result.text, productIds: result.products.map((product) => product.id) };
  }

  @Get('token-pricing')
  @Roles(UserRole.Panel)
  getTokenPricing(): {
    pricePer1000Toman: number;
    tokensPerK: number;
    minPurchaseK: number;
  } {
    const n = Number(process.env.AI_CHATBOT_TOKEN_PRICE_PER_1000 || 0);
    return {
      pricePer1000Toman: Number.isFinite(n) && n > 0 ? n : 0,
      tokensPerK: 1000,
      minPurchaseK: 1000,
    };
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

    const { tokenBalance: _ignoredBalance, ...patch } = aiChatbot;

    // Find existing AI chatbot for the shop
    const existingAiChatbot = shop.aiChatbot;

    if (existingAiChatbot) {
      // Update existing AI chatbot
      await this.aiChatbotRepo.update(existingAiChatbot.id, patch);
      return this.aiChatbotRepo.findOne({ where: { id: existingAiChatbot.id } });
    } else {
      // Create new AI chatbot
      const newAiChatbot = this.aiChatbotRepo.create({
        ...patch,
        smsAccount: shop.smsAccount,
        status: patch.status || 1, // Default status
      });

      const savedAiChatbot = await this.aiChatbotRepo.save(newAiChatbot);

      // Update shop with the new AI chatbot
      await this.shopRepo.update(shop.id, { aiChatbot: savedAiChatbot });

      return savedAiChatbot;
    }
  }
}
