import { AiChat, AiChatMessage, Menu, Product, ProductVariant, Shop } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateText } from 'ai';

const MODEL = process.env.AI_CHAT_MODEL;
const DEFAULT_SYSTEM_PROMPT = `لطفاً اعداد را با استفاده از جداکننده هزارگان (سه رقم سه رقم) نمایش بده.
تو به تمام لیست محصولات و قیمت‌هایشان دسترسی داری و نیازی به پرسیدن کد یا شناسه از کاربر نداری. مستقیماً جواب کاربر را بده.
پاسخ را به صورت متن ساده و طبیعی برای کاربر بنویس، نه JSON.
متن پیام‌های بله با Markdown قالب‌بندی می‌شود.
برای برجسته/بولد نوشتن، متن را بین دو ستاره بگذار؛ مثل ** متن بولد **. حتماً قبل از ستاره اول و بعد از ستاره دوم یک فاصله باشد.
برای کج/ایتالیک نوشتن، متن را بین دو زیرخط بگذار؛ مثل __ متن ایتالیک __. حتماً قبل از زیرخط اول و بعد از زیرخط دوم یک فاصله باشد.
فقط وقتی شماره محصول را در آرایه انتهای پاسخ قرار بده که کاربر مستقیم درباره همان محصول سوال کرده باشد یا برای پاسخ دادن لازم باشد جزئیات بیشتر/لینک سفارش همان محصول را بدهی.
صرفاً به خاطر اینکه اسم محصولی در پاسخ آمده، آن محصول را پیشنهاد نده و شماره‌اش را در آرایه نگذار.
در انتهای پاسخ، در یک خط جداگانه فقط آرایه شماره محصولات پیشنهادی را بنویس؛ مانند:
[2,4]
اگر محصولی پیشنهاد نمی‌دهی، در خط آخر فقط [] بنویس.
هیچ متن دیگری بعد از این آرایه ننویس.`;
const SYSTEM_PROMPT = (process.env.AI_CHAT_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT).replace(
  /\\n/g,
  '\n',
);

const CHAT_SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 10;
const FALLBACK_MESSAGE = 'متاسفانه در تولید پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.';

type ParsedAiResponse = {
  text: string;
  productIds: string[];
};

type ShopAiKnowledge = {
  info: string;
  productIdsByIndex: string[];
};

@Injectable()
export class AiChatbotService {
  constructor(
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(AiChat)
    private aiChatRepo: Repository<AiChat>,
    @InjectRepository(AiChatMessage)
    private aiChatMessageRepo: Repository<AiChatMessage>,
    private redis: RedisService,
  ) {}

  async chat(shopId: string, userId: string, message: string, chatId?: number) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['aiChatbot'] });
    const chat = await this.getOrCreateChat(shop, userId, chatId);
    const shopAiKnowledge = await this.getShopAiKnowledge(shopId);
    const messages = this.buildMessages(shopAiKnowledge.info, shop, chat.messages || [], message);

    const { text, usage } = await generateText({
      model: createOpenAICompatible({
        baseURL: process.env.AI_BASE_URL,
        name: 'example',
        apiKey: process.env.AI_API_KEY,
      }).chatModel(MODEL),
      messages,
    });

    this.logAiResponse(text, usage);

    const parsedResponse = this.parsePlainTextResponse(text);
    const finalMessage = parsedResponse.text || FALLBACK_MESSAGE;
    const productIds = this.resolveProductIds(parsedResponse.productIds, shopAiKnowledge.productIdsByIndex);

    await this.aiChatMessageRepo.save({
      userMessage: message,
      botMessage: finalMessage,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      model: MODEL,
      aiChat: { id: chat.id },
    });

    return { text: finalMessage, productIds };
  }

  private async getOrCreateChat(shop: Shop, userId: string, chatId?: number): Promise<AiChat> {
    if (chatId) {
      const chat = await this.aiChatRepo.findOne({ where: { id: chatId }, relations: ['messages'] });
      if (chat) {
        chat.messages ||= [];
        return chat;
      }
    }

    const activeChat = await this.findActiveChat(shop.id, userId);
    if (activeChat) return activeChat;

    const chat = this.aiChatRepo.create({
      shop: { id: shop.id },
      aiChatbot: { id: shop.aiChatbot.id },
      user: { id: userId },
    });

    const savedChat = await this.aiChatRepo.save(chat);
    savedChat.messages = [];
    return savedChat;
  }

  private async findActiveChat(shopId: string, userId: string): Promise<AiChat | null> {
    const chat = await this.aiChatRepo.findOne({
      where: { shop: { id: shopId }, user: { id: userId } },
      relations: ['messages'],
      order: { createdAt: 'DESC' },
    });

    if (!chat) return null;

    chat.messages ||= [];
    this.sortMessagesByCreatedAt(chat.messages);

    return this.isChatExpired(chat) ? null : chat;
  }

  private sortMessagesByCreatedAt(messages: AiChatMessage[]) {
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  private isChatExpired(chat: AiChat) {
    const lastMessage = chat.messages?.[chat.messages.length - 1];
    const lastInteraction = new Date(lastMessage?.createdAt || chat.createdAt).getTime();
    return Date.now() - lastInteraction > CHAT_SESSION_TIMEOUT_MS;
  }

  private buildMessages(
    shopKnowledge: string,
    shop: Shop,
    history: AiChatMessage[],
    userMessage: string,
  ): CoreMessage[] {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: [shopKnowledge, this.getChatbotConfigPrompt(shop), SYSTEM_PROMPT].join('\n\n'),
      },
    ];

    history.slice(-MAX_HISTORY_MESSAGES).forEach((message) => {
      if (message.userMessage) messages.push({ role: 'user', content: message.userMessage });
      if (message.botMessage) messages.push({ role: 'assistant', content: message.botMessage });
    });

    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  private getChatbotConfigPrompt(shop: Shop) {
    return `لحن: ${shop.aiChatbot.style || ''}

اطلاعات اضافی: ${shop.aiChatbot.extraInfo || ''}`;
  }

  private logAiResponse(text: string, usage: unknown) {
    console.log('--- AI Response Debug ---');
    console.log('AI Text:', text);
    console.log('Usage:', JSON.stringify(usage));
    console.log('-------------------------');
  }

  private parsePlainTextResponse(response: string): ParsedAiResponse {
    const trimmedResponse = response.trim();
    const arrayStart = trimmedResponse.lastIndexOf('[');
    if (arrayStart === -1 || !trimmedResponse.endsWith(']')) {
      return { text: response.trim(), productIds: [] };
    }

    const productIds = this.parseProductIds(trimmedResponse.slice(arrayStart));
    return {
      text: trimmedResponse.slice(0, arrayStart).trim(),
      productIds,
    };
  }

  private parseProductIds(arrayText: string): string[] {
    try {
      const parsed = JSON.parse(arrayText);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => String(id).trim()).filter(Boolean);
      }
    } catch (e) {
      console.error('Failed to parse AI product IDs:', e);
    }

    return arrayText
      .slice(1, -1)
      .split(',')
      .map((id) => id.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  private resolveProductIds(productRefs: string[], productIdsByIndex: string[]): string[] {
    const productIds = productRefs
      .map((ref) => {
        const productIndex = Number(ref);
        if (Number.isInteger(productIndex) && productIndex >= 1 && productIndex <= productIdsByIndex.length) {
          return productIdsByIndex[productIndex - 1];
        }

        return productIdsByIndex.includes(ref) ? ref : undefined;
      })
      .filter(Boolean);

    return [...new Set(productIds)];
  }

  private async getShopAiKnowledge(shopId: string): Promise<ShopAiKnowledge> {
    const shopRedisData = await this.redis.updateShop(shopId);
    const menuRedisData = await this.redis.updateMenu(shopId);
    const menu: Menu = JSON.parse(menuRedisData);
    Menu.setRefsAndSort(menu, undefined, false, false);

    const products = Menu.getProductList(menu);
    const info = `اطلاعات مجموعه: ${shopRedisData}
لیست کامل محصولات:
${products
  .map((product, index) => this.formatProductKnowledge(product, index))
  .join('\n')}
`;
    return { info, productIdsByIndex: products.map((product) => product.id) };
  }

  private formatProductKnowledge(product: Product, index: number) {
    const parts = [
      `- ${product.title} (شماره محصول: ${index + 1})`,
      `دسته: ${product.category?.title || 'بدون دسته'}`,
    ];

    if (product.description) parts.push(`توضیحات: ${product.description}`);

    parts.push(
      product.variants?.length
        ? `انواع: ${product.variants.map((variant) => this.formatVariantKnowledge(product, variant)).join('، ')}`
        : this.formatProductPrice(product),
    );

    return parts.join(' | ');
  }

  private formatVariantKnowledge(product: Product, variant: ProductVariant) {
    const parts = [`${variant.title} (قیمت: ${Product.realPrice(product, variant)})`];
    if (Product.hasDiscount(product, variant)) parts.push(`قیمت با تخفیف: ${Product.totalPrice(product, variant)}`);
    if (Product.isFinished(product, variant)) parts.push('[تمام شده]');
    return parts.join(' ');
  }

  private formatProductPrice(product: Product) {
    const parts = [`قیمت: ${Product.realPrice(product)}`];
    if (Product.hasDiscount(product)) parts.push(`قیمت با تخفیف: ${Product.totalPrice(product)}`);
    if (Product.isFinished(product)) parts.push('[تمام شده]');
    return parts.join(' ');
  }
}
