import { AiChat, AiChatbot, AiChatMessage, Menu, Product, Shop, User } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisKey, RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateObject } from 'ai';
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
        const lastInteraction =
          chat.messages?.length > 0
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
تو به تمام لیست محصولات و قیمت‌هایشان دسترسی داری و نیازی به پرسیدن کد یا شناسه از کاربر نداری. مستقیماً جواب کاربر را بده.`,
    });

    if (aiChatbot.introMessage) {
      messages.push({
        role: 'assistant',
        content: aiChatbot.introMessage,
      });
    }

    if (chat.messages?.length > 0) {
      chat.messages.forEach((m) => {
        if (m.userMessage) messages.push({ role: 'user', content: m.userMessage });
        if (m.botMessage) messages.push({ role: 'assistant', content: m.botMessage });
      });
    }

    messages.push({
      role: 'user',
      content: message,
    });

    const { object, usage } = await generateObject({
      model: createOpenAICompatible({
        baseURL: process.env.AI_BASE_URL,
        name: 'example',
        apiKey: process.env.AI_API_KEY,
      }).chatModel(MODEL),
      messages,
      schema: z.object({
        text: z.string().describe('متن پاسخی که قرار است به کاربر نمایش داده شود'),
        productIds: z
          .array(z.string())
          .optional()
          .describe('لیست کد محصولاتی (IDs) که در پیام به آن‌ها اشاره شده یا قصد داری به کاربر پیشنهاد دهی'),
      }),
    });

    // Logging for debugging the AI flow
    console.log('--- AI Response Debug ---');
    console.log('AI Object:', JSON.stringify(object));
    console.log('Usage:', JSON.stringify(usage));
    console.log('-------------------------');

    const finalMessage = object.text || 'متاسفانه در تولید پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.';

    await this.aiChatMessageRepo.save({
      userMessage: message,
      botMessage: finalMessage,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      model: MODEL,
      aiChat: { id: chat.id },
    });

    return { text: finalMessage, productIds: object.productIds || [] };
  }

  private async getShopAiKnowledge(shopId: string) {
    // Force cache update to ensure fresh data
    const shopRedisData = await this.redis.updateShop(shopId);
    const menuRedisData = await this.redis.updateMenu(shopId);
    const menu: Menu = JSON.parse(menuRedisData);
    Menu.setRefsAndSort(menu, undefined, false, false);

    const products = Menu.getProductList(menu);
    const info = `اطلاعات مجموعه: ${shopRedisData}
لیست کامل محصولات:
${products
  .map((x) => {
    let str = `- ${x.title} (کد محصول: ${x.id}) | دسته: ${x.category?.title || 'بدون دسته'}`;
    if (x.description) str += ` | توضیحات: ${x.description}`;
    if (x.variants?.length) {
      str +=
        ` | انواع: ` +
        x.variants
          .map((v) => {
            let vStr = `${v.title} (قیمت: ${Product.realPrice(x, v)})`;
            if (Product.hasDiscount(x, v)) vStr += ` قیمت با تخفیف: ${Product.totalPrice(x, v)}`;
            if (Product.isFinished(x, v)) vStr += ` [تمام شده]`;
            return vStr;
          })
          .join('، ');
    } else {
      str += ` | قیمت: ${Product.realPrice(x)}`;
      if (Product.hasDiscount(x)) str += ` قیمت با تخفیف: ${Product.totalPrice(x)}`;
      if (Product.isFinished(x)) str += ` [تمام شده]`;
    }
    return str;
  })
  .join('\n')}
`;
    return info;
  }
}
