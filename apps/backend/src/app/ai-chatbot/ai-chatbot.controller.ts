import { AiChatbot, Shop, UserRole } from '@menno/types';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('ai-chatbot')
export class AiChatbotController {
  constructor(
    @InjectRepository(AiChatbot)
    private aiChatbotRepo: Repository<AiChatbot>,
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    private auth: AuthService,
  ) {}

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
