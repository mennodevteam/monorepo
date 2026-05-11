import { AiChat, AiChatMessage, Menu, Product, ProductVariant, Shop } from '@menno/types';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateText } from 'ai';

const MODEL = process.env.AI_CHAT_MODEL;
const DEFAULT_SYSTEM_PROMPT = `لطفاً اعداد را با استفاده از جداکننده هزارگان (سه رقم سه رقم) نمایش بده.
پاسخ را به صورت متن ساده و طبیعی برای کاربر بنویس، نه JSON.
اگر کاربر جزئیات بیشتری از محصول خواست، او را به مشاهده محصول در سایت راهنمایی کن.
فقط وقتی شماره محصول را در آرایه انتهای پاسخ قرار بده که کاربر مستقیم درباره همان محصول سوال کرده باشد یا برای پاسخ دادن لازم باشد جزئیات بیشتر/لینک سفارش همان محصول را بدهی.
صرفاً به خاطر اینکه اسم محصولی در پاسخ آمده، شماره‌اش را در آرایه نگذار.
در خط آخر فقط آرایه شماره محصولات پیشنهادی را بنویس؛ مانند:
[2,4]
اگر محصولی پیشنهاد نمی‌دهی، [] بنویس. هیچ متن دیگری بعد از این آرایه ننویس.`;
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

type ProductRef = {
  id: string;
  title: string;
};

type ShopAiKnowledge = {
  info: string;
  productsByIndex: ProductRef[];
};

@Injectable()
export class AiChatbotService {
  private readonly logger = new Logger(AiChatbotService.name);

  constructor(
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(AiChat)
    private aiChatRepo: Repository<AiChat>,
    @InjectRepository(AiChatMessage)
    private aiChatMessageRepo: Repository<AiChatMessage>,
    private redis: RedisService,
  ) {}

  async chat(shopId: string, userId: string, message: string, chatId?: number, traceId = this.createTraceId()) {
    this.logger.log(
      `[${traceId}] start shopId=${shopId} userId=${userId} chatId=${chatId || '-'} model=${MODEL || '-'} input="${this.preview(
        message,
      )}"`,
    );

    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['aiChatbot'] });
    this.logger.log(
      `[${traceId}] shop loaded hasAiChatbot=${!!shop?.aiChatbot} status=${shop?.aiChatbot?.status || '-'} styleLen=${
        shop?.aiChatbot?.style?.length || 0
      } extraInfoLen=${shop?.aiChatbot?.extraInfo?.length || 0}`,
    );

    const chat = await this.getOrCreateChat(shop, userId, chatId);
    this.logger.log(`[${traceId}] chat ready id=${chat.id} historyRows=${chat.messages?.length || 0}`);

    const shopAiKnowledge = await this.getShopAiKnowledge(shopId);
    this.logger.log(
      `[${traceId}] knowledge ready products=${shopAiKnowledge.productsByIndex.length} infoLen=${shopAiKnowledge.info.length}`,
    );

    const messages = this.buildMessages(shopAiKnowledge.info, shop, chat.messages || [], message);
    this.logMessages(traceId, messages);

    const { text, usage } = await this.generateAiText(messages, traceId);

    this.logAiResponse(traceId, text, usage);

    const parsedResponse = this.parsePlainTextResponse(text);
    const finalMessage = parsedResponse.text || FALLBACK_MESSAGE;
    const products = this.resolveProducts(parsedResponse.productIds, shopAiKnowledge.productsByIndex);
    const productIds = products.map((product) => product.id);
    this.logger.log(
      `[${traceId}] parsed textLen=${finalMessage.length} productRefs=${JSON.stringify(
        parsedResponse.productIds,
      )} resolvedProducts=${JSON.stringify(products)} finalText="${this.preview(finalMessage)}"`,
    );

    await this.aiChatMessageRepo.save({
      userMessage: message,
      botMessage: finalMessage,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      model: MODEL,
      aiChat: { id: chat.id },
    });
    this.logger.log(`[${traceId}] saved ai chat message chatId=${chat.id}`);

    return { text: finalMessage, productIds, products };
  }

  private async generateAiText(messages: CoreMessage[], traceId: string) {
    try {
      this.logger.log(
        `[${traceId}] calling ai baseURL=${process.env.AI_BASE_URL || '-'} model=${MODEL || '-'} messages=${messages.length}`,
      );
      return await generateText({
        model: createOpenAICompatible({
          baseURL: process.env.AI_BASE_URL,
          name: 'example',
          apiKey: process.env.AI_API_KEY,
        }).chatModel(MODEL),
        messages,
      });
    } catch (error) {
      this.logAiError(traceId, error);
      throw error;
    }
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

  private logMessages(traceId: string, messages: CoreMessage[]) {
    this.logger.log(
      `[${traceId}] prompt messages=${JSON.stringify(
        messages.map((message, index) => ({
          index,
          role: message.role,
          length: typeof message.content === 'string' ? message.content.length : 0,
          preview: typeof message.content === 'string' ? this.preview(message.content) : '[non-text content]',
        })),
      )}`,
    );
  }

  private logAiResponse(traceId: string, text: string, usage: unknown) {
    this.logger.log(`[${traceId}] ai response textLen=${text.length} text="${this.preview(text, 1500)}"`);
    this.logger.log(`[${traceId}] ai usage=${this.safeJson(usage)}`);
  }

  private logAiError(traceId: string, error: unknown) {
    const err = error as Error & {
      cause?: unknown;
      statusCode?: number;
      responseBody?: unknown;
    };

    this.logger.error(`[${traceId}] ai error message=${err?.message || error}`);
    if (err?.statusCode) this.logger.error(`[${traceId}] ai error status=${err.statusCode}`);
    if (err?.responseBody) this.logger.error(`[${traceId}] ai error responseBody=${this.safeJson(err.responseBody)}`);
    if (err?.cause) this.logger.error(`[${traceId}] ai error cause=${this.safeJson(err.cause)}`);
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

  private resolveProducts(productRefs: string[], productsByIndex: ProductRef[]): ProductRef[] {
    const products = productRefs
      .map((ref) => {
        const productIndex = Number(ref);
        if (Number.isInteger(productIndex) && productIndex >= 1 && productIndex <= productsByIndex.length) {
          return productsByIndex[productIndex - 1];
        }

        return productsByIndex.find((product) => product.id === ref);
      })
      .filter(Boolean);

    return [...new Map(products.map((product) => [product.id, product])).values()];
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
    return { info, productsByIndex: products.map((product) => ({ id: product.id, title: product.title })) };
  }

  private formatProductKnowledge(product: Product, index: number) {
    const parts = [
      `- ${product.title} (شماره محصول: ${index + 1})`,
      `دسته: ${product.category?.title || 'بدون دسته'}`,
    ];

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

  private createTraceId() {
    return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private preview(value: string, max = 500) {
    const normalized = (value || '').replace(/\s+/g, ' ').trim();
    return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
  }

  private safeJson(value: unknown) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
