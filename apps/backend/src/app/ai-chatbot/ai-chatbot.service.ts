import { AiChat, AiChatbot, AiChatMessage, Menu, Product, Shop, User } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisKey, RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateText, tool } from 'ai';
import { z } from 'zod';

const MODEL = process.env.AI_CHAT_MODEL;
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
    @InjectRepository(AiChatMessage)
    private aiChatMessageRepo: Repository<AiChatMessage>,
    private redis: RedisService,
  ) {}

  async chat(shopId: string, userId: string, message: string, chatId?: number) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['aiChatbot'] });
    const aiChatbot = shop.aiChatbot;
    let chat: AiChat;
    if (chatId) {
      chat = await this.aiChatRepo.findOne({ where: { id: chatId }, relations: ['messages'] });
    } else {
      chat = await this.aiChatRepo.findOne({
        where: { shop: { id: shopId }, user: { id: userId } },
        relations: ['messages'],
        order: { createdAt: 'DESC' },
      });

      if (chat) {
        // Sort messages by creation date ascending
        if (chat.messages) {
          chat.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        
        // Check if chat has expired (1 hour of inactivity)
        const lastInteraction = chat.messages?.length > 0 
          ? new Date(chat.messages[chat.messages.length - 1].createdAt).getTime()
          : new Date(chat.createdAt).getTime();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        
        if (lastInteraction < oneHourAgo) {
          chat = null; // Start a new session
        }
      }

      if (!chat) {
        chat = this.aiChatRepo.create({
          shop: { id: shopId },
          aiChatbot: { id: shop.aiChatbot.id },
          user: { id: userId },
        });
        chat = await this.aiChatRepo.save(chat);
      }
    }

    if (!chat.messages) {
      chat.messages = [];
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
      content: `لطفاً اعداد را با استفاده از جداکننده هزارگان (سه رقم سه رقم) نمایش بده.
هیچ‌وقت از کاربر شناسه (ID) یا ایندکس محصول نخواه! تو خودت باید ایندکس محصول مورد نظر کاربر را از لیستی که در سیستم به تو داده شده پیدا کنی و آن را به ابزار getProductPriceAndInfo بفرستی.`,
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

    await this.aiChatMessageRepo.save({
      message,
      isFromUser: true,
      aiChat: { id: chat.id },
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
            'برای دریافت قیمت و اطلاعات دقیق یک محصول، ایندکس (index) آن محصول را از لیست محصولات در حافظه‌ات پیدا کن و به این تابع بده. به هیچ وجه از کاربر شناسه یا ایندکس نخواه.',
          parameters: z.object({
            productIndex: z.number().describe('ایندکس محصول (index) در لیست محصولات'),
          }),
          execute: async ({ productIndex }) => await this.getProductInfo(shopId, productIndex),
        }),
      },
      messages,
      maxSteps: 5,
    });

    // Logging for debugging the AI flow
    console.log('--- AI Response Debug ---');
    console.log('AI Text:', text);
    console.log('Tool Calls:', JSON.stringify(toolCalls, null, 2));
    console.log('Steps:', JSON.stringify(steps?.map(s => s.toolCalls), null, 2));
    console.log('-------------------------');

    await this.aiChatMessageRepo.save({
      message: text,
      isFromUser: false,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      aiChat: { id: chat.id },
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
    لیست محصولات (شامل index هر محصول برای استفاده در ابزارها):
    ${products.map((x, index) => `index: ${index}, name: ${x.title}, category: ${x.category.title}`).join('\n')}
    `;
    return info;
  }

  private async getProductInfo(shopId: string, productIndex: number) {
    console.log('getProductInfo', shopId, productIndex);
    const menu = await this.getMenuInfo(shopId);
    const products = Menu.getProductList(menu);
    const product = products[productIndex];
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
