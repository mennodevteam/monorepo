import { AiChat, AiChatbot, Menu, Product, Shop, User } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisKey, RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateText } from 'ai';

@Injectable()
export class AiChatbotService {
  constructor(
    @InjectRepository(AiChatbot)
    private aiChatbotRepo: Repository<AiChatbot>,
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(AiChat)
    private aiChatRepo: Repository<AiChat>,
    private redis: RedisService,
  ) {}

  async chat(shopId: string, userId: string, message: string, chatId?: number) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['aiChatbot'] });
    const aiChatbot = shop.aiChatbot;
    let chat: AiChat;
    if (chatId) {
      chat = await this.aiChatRepo.findOne({ where: { id: chatId }, relations: ['messages'] });
    } else {
      chat = await this.aiChatRepo.create({
        shop: { id: shopId },
        aiChatbot: { id: shop.aiChatbot.id },
        user: { id: userId },
      });
    }

    const messages: CoreMessage[] = [];

    messages.push({
      role: 'system',
      content: await this.getShopAiKnowledge(shopId),
    });

    messages.push({
      role: 'system',
      content: `لحن: ${aiChatbot.style}
          
          اطلاعات اضافی: ${aiChatbot.extraInfo}`,
    });

    messages.push({
      role: 'system',
      content: `لطفاً اعداد را با استفاده از جداکننده هزارگان (سه رقم سه رقم) نمایش بده`,
    });

    if (aiChatbot.introMessage) {
      messages.push({
        role: 'assistant',
        content: aiChatbot.introMessage,
      });
    }

    if (chat.messages?.length > 0) {
      messages.push(
        ...chat.messages.map(
          (message) =>
            ({
              role: message.isFromUser ? 'user' : 'assistant',
              content: message.message,
            }) as CoreMessage,
        ),
      );
    }

    messages.push({
      role: 'user',
      content: message,
    });

    const { text, usage } = await generateText({
      model: createOpenAICompatible({
        baseURL: process.env.AI_BASE_URL,
        name: 'example',
        apiKey: process.env.AI_API_KEY,
      }).chatModel('openai/gpt-4o-mini'),
      messages,
    });

    console.log('usage', usage);

    return text;
  }

  private async getShopAiKnowledge(shopId: string) {
    // const shop = await this.shopRepo.findOne({
    //   where: { id: shopId },
    //   relations: [
    //     'aiChatbot',
    //     'menu',
    //     'menu.products',
    //     'menu.products.productVariants',
    //     'menu.products.productVariants',
    //   ],
    // });

    const shopRedisKey = this.redis.key(RedisKey.Shop, shopId);
    let shopRedisData = await this.redis.client.get(shopRedisKey);
    if (!shopRedisData) shopRedisData = await this.redis.updateShop(shopId);

    const menuRedisKey = this.redis.key(RedisKey.PanelMenu, shopId);
    let menuRedisData = await this.redis.client.get(menuRedisKey);
    if (!menuRedisData) menuRedisData = await this.redis.updateMenu(shopId);
    const menu: Menu = JSON.parse(menuRedisData);
    Menu.setRefsAndSort(menu, undefined, false, false);
    const products = Menu.getProductList(menu).map((product) => {
      let dataString = `* ${product.title}
-دسته بندی: ${product.category.title}
-توضیحات: ${product.description}
`;

      if (product.variants?.length) {
        let variantString = `-انواع:`;
        for (const variant of product.variants) {
          variantString += `**${variant.title}
-قیمت: ${Product.realPrice(product, variant)}
-قیمت پس از تخفیف: ${Product.totalPrice(product, variant)}
-وضعیت: ${Product.isFinished(product, variant) ? 'تمام شده' : 'موجود'}\n\n`;
        }
        dataString += variantString;
      } else {
        dataString += `-قیمت: ${Product.realPrice(product)}
-قیمت پس از تخفیف: ${Product.totalPrice(product)}
-وضعیت: ${Product.isFinished(product) ? 'تمام شده' : 'موجود'}`;
      }

      return dataString;
    });

    return `اطلاعات مجموعه: ${JSON.stringify(shopRedisData)}

    منو: ${products}
    
    `;
  }
}
