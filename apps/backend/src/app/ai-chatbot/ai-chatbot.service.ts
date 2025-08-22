import { AiChat, AiChatbot, Menu, Product, Shop, User } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisKey, RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateText, tool } from 'ai';
import { z } from 'zod';

const MODEL = 'google/gemini-2.0-flash-001';
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

    const { text, usage, toolCalls, toolResults, steps } = await generateText({
      model: createOpenAICompatible({
        baseURL: process.env.AI_BASE_URL,
        name: 'example',
        apiKey: process.env.AI_API_KEY,
      }).chatModel(MODEL),
      tools: {
        getProductPriceAndInfo: tool({
          description:
            'اگر کاربر قیمت محصولات پرسید یا اطلاعاتی بیشتری از محصولات را خواسته باشد از این تابع استفاده کن',
          parameters: z.object({
            id: z.string(),
          }),
          execute: async ({ id }: { id: string }) => await this.getProductInfo(shopId, id),
        }),
      },
      messages,
      maxSteps: 5,
    });

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

    const products = Menu.getProductList(menu);
    const info = `اطلاعات مجموعه: ${JSON.stringify(shopRedisData)}
    محصولات:
    ${products.map((x, index) => `[${index}]: ${x.title} - ${x.category.title}`).join('\n')}
    `;
    return info;
  }

  private async getProductInfo(shopId: string, id: string) {
    console.log('getProductInfo', shopId, id);
    const menu = await this.getMenuInfo(shopId);
    const products = Menu.getProductList(menu);
    const product = products[parseInt(id)];
    if (product) {
      let result = `
      ${product.title} (دسته بندی: ${product.category.title})
      ${product.description}
      `;
      if (product.variants?.length) {
        result += `
        ${product.variants
          .map((x) => {
            let result = `-${x.title} (قیمت: ${Product.realPrice(product, x)})`;
            if (Product.hasDiscount(product, x)) {
              result += ` قیمت پس از تخفیف: ${Product.totalPrice(product, x)}`;
            }
            if (Product.isFinished(product, x)) {
              result += ` وضعیت: تمام شده`;
            }
            return result;
          })
          .join('\n')}
        `;
      } else {
        result += `
        قیمت: ${Product.realPrice(product)}
        `;
        if (Product.hasDiscount(product)) {
          result += `
          قیمت پس از تخفیف: ${Product.totalPrice(product)}
          `;
          if (Product.isFinished(product)) {
            result += ` وضعیت: تمام شده`;
          }
        }
      }

      return result;
    }
    return null;
  }

  private async getShopInfo(shopId: string) {
    const shopRedisKey = this.redis.key(RedisKey.Shop, shopId);
    let shopRedisData = await this.redis.client.get(shopRedisKey);
    if (!shopRedisData) shopRedisData = await this.redis.updateShop(shopId);
    return shopRedisData;
  }

  private async getMenuInfo(shopId: string) {
    const menuRedisKey = this.redis.key(RedisKey.PanelMenu, shopId);
    let menuRedisData = await this.redis.client.get(menuRedisKey);
    if (!menuRedisData) menuRedisData = await this.redis.updateMenu(shopId);
    const menu: Menu = JSON.parse(menuRedisData);
    Menu.setRefsAndSort(menu, undefined, false, false);
    return menu;
  }
}
