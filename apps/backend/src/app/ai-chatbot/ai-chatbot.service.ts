import { AiChat, AiChatbot, AiChatMessage, Menu, Product, Shop } from '@menno/types';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../core/redis.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { CoreMessage, generateText } from 'ai';

const MODEL = process.env.AI_CHAT_MODEL;
const PRODUCT_MARKER = process.env.AI_CHAT_PRODUCT_MARKER || '__NEED_PRODUCTS__';
const MAX_PRODUCT_CONTEXT = Number(process.env.AI_CHAT_MAX_PRODUCT_CONTEXT || 12);
const DEFAULT_LIGHT_SYSTEM_PROMPT = `لطفاً اعداد را با استفاده از جداکننده هزارگان (سه رقم سه رقم) نمایش بده.
پاسخ را به صورت متن ساده و طبیعی برای کاربر بنویس، نه JSON.
تو نمی‌توانی مستقیم محصول بفروشی. نقش تو پشتیبان، معرفی محصول و راهنمای خرید است؛ برای خرید، مشتری باید وارد سایت شود.
اگر برای پاسخ دادن به اطلاعات محصولات، قیمت‌ها، موجودی، انواع محصول یا پیشنهاد محصول نیاز داری، فقط عبارت ${PRODUCT_MARKER} را برگردان و هیچ متن دیگری ننویس.
اگر بدون دانش محصولات می‌توانی جواب بدهی، پاسخ را مستقیم و کوتاه بنویس.`;
const DEFAULT_PRODUCT_SELECTOR_PROMPT = `از لیست محصولات، محصولاتی را انتخاب کن که به پیام کاربر مربوط هستند.
فقط عنوان محصولات را می‌بینی؛ اگر محصول مرتبطی پیدا نکردی [] برگردان.
خروجی فقط یک آرایه شماره محصول باشد؛ مثل [1,3]. هیچ متن دیگری ننویس.`;
const DEFAULT_PRODUCT_SYSTEM_PROMPT = `لطفاً اعداد را با استفاده از جداکننده هزارگان (سه رقم سه رقم) نمایش بده.
پاسخ را به صورت متن ساده و طبیعی برای کاربر بنویس، نه JSON.
تو نمی‌توانی مستقیم محصول بفروشی. نقش تو پشتیبان، معرفی محصول و راهنمای خرید است؛ برای خرید، مشتری باید وارد سایت شود.
اگر کاربر جزئیات بیشتری از محصول خواست، او را به مشاهده محصول در سایت راهنمایی کن.
فقط وقتی شماره محصول را در آرایه انتهای پاسخ قرار بده که کاربر مستقیم درباره همان محصول سوال کرده باشد یا برای پاسخ دادن لازم باشد جزئیات بیشتر/لینک سفارش همان محصول را بدهی.
صرفاً به خاطر اینکه اسم محصولی در پاسخ آمده، شماره‌اش را در آرایه نگذار.
در خط آخر فقط آرایه شماره محصولات پیشنهادی را بنویس؛ مانند:
[2,4]
اگر محصولی پیشنهاد نمی‌دهی، [] بنویس. هیچ متن دیگری بعد از این آرایه ننویس.`;
const LIGHT_SYSTEM_PROMPT = (
  process.env.AI_CHAT_LIGHT_SYSTEM_PROMPT?.trim() || DEFAULT_LIGHT_SYSTEM_PROMPT
).replace(/\\n/g, '\n');
const PRODUCT_SELECTOR_PROMPT = (
  process.env.AI_CHAT_PRODUCT_SELECTOR_PROMPT?.trim() || DEFAULT_PRODUCT_SELECTOR_PROMPT
).replace(/\\n/g, '\n');
const PRODUCT_SYSTEM_PROMPT = (process.env.AI_CHAT_SYSTEM_PROMPT?.trim() || DEFAULT_PRODUCT_SYSTEM_PROMPT).replace(
  /\\n/g,
  '\n',
);

const CHAT_SESSION_TIMEOUT_MS = 3 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 3;
const FALLBACK_MESSAGE = 'متاسفانه در تولید پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.';
const MIN_TOKEN_BALANCE_TO_CHAT = Number(process.env.AI_CHATBOT_MIN_BALANCE_TO_CHAT || 100);

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

type LightShopKnowledge = {
  info: string;
  menu: Menu;
};

type AiUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
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
    @InjectRepository(AiChatbot)
    private aiChatbotRepo: Repository<AiChatbot>,
    private redis: RedisService,
  ) {}

  async chat(shopId: string, userId: string, message: string, chatId?: number, traceId = this.createTraceId()) {
    this.logger.log(
      `[${traceId}] start shopId=${shopId} userId=${userId} chatId=${chatId || '-'} model=${MODEL || '-'} input="${this.preview(
        message,
      )}"`,
    );

    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['aiChatbot'] });
    if (!shop) {
      throw new HttpException('Shop not found', HttpStatus.NOT_FOUND);
    }
    this.logger.log(
      `[${traceId}] shop loaded hasAiChatbot=${!!shop.aiChatbot} status=${shop.aiChatbot?.status || '-'} styleLen=${
        shop.aiChatbot?.style?.length || 0
      } extraInfoLen=${shop.aiChatbot?.extraInfo?.length || 0} tokenBalance=${shop.aiChatbot?.tokenBalance ?? '-'}`,
    );

    if (!shop.aiChatbot) {
      throw new HttpException('AI chatbot not found', HttpStatus.NOT_FOUND);
    }

    const tokenBalance = shop.aiChatbot.tokenBalance ?? 0;
    if (tokenBalance < MIN_TOKEN_BALANCE_TO_CHAT) {
      throw new HttpException(
        'موجودی توکن چت‌بات کافی نیست. از بخش تنظیمات ربات هوشمند در پنل، توکن خریداری کنید.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const chat = await this.getOrCreateChat(shop, userId, chatId);
    this.logger.log(`[${traceId}] chat ready id=${chat.id} historyRows=${chat.messages?.length || 0}`);

    const lightKnowledge = await this.getLightShopKnowledge(shop);
    this.logger.log(
      `[${traceId}] light knowledge ready categories=${lightKnowledge.menu.categories?.length || 0} infoLen=${
        lightKnowledge.info.length
      }`,
    );

    const lightMessages = this.buildMessages(lightKnowledge.info, shop, chat.messages || [], message, LIGHT_SYSTEM_PROMPT);
    this.logMessages(traceId, 'light', lightMessages);

    this.logger.log(`[${traceId}] light ai start`);
    const lightResult = await this.generateAiText(lightMessages, traceId, 'light');
    this.logAiResponse(traceId, 'light', lightResult.text, lightResult.usage);

    const needsProducts = this.needsProductKnowledge(lightResult.text);
    this.logger.log(`[${traceId}] needs products=${needsProducts} lightText="${this.preview(lightResult.text, 1000)}"`);

    let finalMessage = lightResult.text.trim() || FALLBACK_MESSAGE;
    let products: ProductRef[] = [];
    let usage: AiUsage = lightResult.usage;

    if (needsProducts) {
      const allProducts = Menu.getProductList(lightKnowledge.menu);
      const selectorMessages = this.buildProductSelectorMessages(allProducts, chat.messages || [], message);
      this.logMessages(traceId, 'product-selector', selectorMessages);

      this.logger.log(`[${traceId}] product selector ai start products=${allProducts.length}`);
      const selectorResult = await this.generateAiText(selectorMessages, traceId, 'product-selector');
      this.logAiResponse(traceId, 'product-selector', selectorResult.text, selectorResult.usage);

      const selectedProductRefs = this.parseProductSelectionResponse(selectorResult.text);
      const candidates = this.resolveProductEntities(selectedProductRefs, allProducts).slice(0, MAX_PRODUCT_CONTEXT);
      usage = this.mergeUsage(usage, selectorResult.usage);
      this.logger.log(
        `[${traceId}] product selector refs=${JSON.stringify(selectedProductRefs)} candidates count=${
          candidates.length
        } titles=${JSON.stringify(
          candidates.map((product) => product.title),
        )}`,
      );

      const productKnowledge = this.getProductKnowledgeForCandidates(candidates);
      const productMessages = this.buildMessages(
        productKnowledge.info,
        shop,
        chat.messages || [],
        message,
        PRODUCT_SYSTEM_PROMPT,
      );
      this.logMessages(traceId, 'product', productMessages);

      this.logger.log(`[${traceId}] product ai start`);
      const productResult = await this.generateAiText(productMessages, traceId, 'product');
      this.logAiResponse(traceId, 'product', productResult.text, productResult.usage);

      const parsedResponse = this.parsePlainTextResponse(productResult.text);
      finalMessage = parsedResponse.text || FALLBACK_MESSAGE;
      products = this.resolveProducts(parsedResponse.productIds, productKnowledge.productsByIndex);
      usage = this.mergeUsage(usage, productResult.usage);
      this.logger.log(
        `[${traceId}] parsed textLen=${finalMessage.length} productRefs=${JSON.stringify(
          parsedResponse.productIds,
        )} resolvedProducts=${JSON.stringify(products)} finalText="${this.preview(finalMessage)}"`,
      );
    }

    const productIds = products.map((product) => product.id);

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

    const tokensUsed =
      usage?.totalTokens ??
      (usage?.promptTokens != null || usage?.completionTokens != null
        ? (usage?.promptTokens || 0) + (usage?.completionTokens || 0)
        : 0);
    if (tokensUsed > 0) {
      await this.aiChatbotRepo.decrement({ id: shop.aiChatbot.id }, 'tokenBalance', tokensUsed);
      this.logger.log(`[${traceId}] decremented tokenBalance by=${tokensUsed} aiChatbotId=${shop.aiChatbot.id}`);
    }

    return { text: finalMessage, productIds, products };
  }

  private async generateAiText(messages: CoreMessage[], traceId: string, stage: string) {
    try {
      this.logger.log(
        `[${traceId}] calling ${stage} ai baseURL=${process.env.AI_BASE_URL || '-'} model=${
          MODEL || '-'
        } messages=${messages.length}`,
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
    systemPrompt: string,
  ): CoreMessage[] {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: [shopKnowledge, this.getChatbotConfigPrompt(shop), systemPrompt].join('\n\n'),
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

  private logMessages(traceId: string, stage: string, messages: CoreMessage[]) {
    this.logger.log(
      `[${traceId}] ${stage} prompt messages=${JSON.stringify(
        messages.map((message, index) => ({
          index,
          role: message.role,
          length: typeof message.content === 'string' ? message.content.length : 0,
          preview: typeof message.content === 'string' ? this.preview(message.content) : '[non-text content]',
        })),
      )}`,
    );
  }

  private logAiResponse(traceId: string, stage: string, text: string, usage: unknown) {
    this.logger.log(`[${traceId}] ${stage} ai response textLen=${text.length} text="${this.preview(text, 1500)}"`);
    this.logger.log(`[${traceId}] ${stage} ai usage=${this.safeJson(usage)}`);
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

  private mergeUsage(first: AiUsage, second: AiUsage): AiUsage {
    return {
      promptTokens: (first?.promptTokens || 0) + (second?.promptTokens || 0),
      completionTokens: (first?.completionTokens || 0) + (second?.completionTokens || 0),
      totalTokens: (first?.totalTokens || 0) + (second?.totalTokens || 0),
    };
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

  private needsProductKnowledge(response: string) {
    return response.trim() === PRODUCT_MARKER;
  }

  private buildProductSelectorMessages(
    products: Product[],
    history: AiChatMessage[],
    userMessage: string,
  ): CoreMessage[] {
    const productList = products.map((product, index) => `${index + 1}. ${product.title}`).join('\n');

    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `${PRODUCT_SELECTOR_PROMPT}

لیست محصولات:
${productList}`,
      },
    ];

    history.slice(-MAX_HISTORY_MESSAGES).forEach((message) => {
      if (message.userMessage) messages.push({ role: 'user', content: message.userMessage });
      if (message.botMessage) messages.push({ role: 'assistant', content: message.botMessage });
    });

    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  private parseProductSelectionResponse(response: string): string[] {
    return this.parsePlainTextResponse(response).productIds;
  }

  private resolveProductEntities(productRefs: string[], productsByIndex: Product[]): Product[] {
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

  private async getLightShopKnowledge(shop: Shop): Promise<LightShopKnowledge> {
    const menuRedisData = await this.redis.updateMenu(shop.id);
    const menu: Menu = JSON.parse(menuRedisData);
    Menu.setRefsAndSort(menu, undefined, false, false);

    const appUrl = Shop.appLink(shop, process.env.APP_ORIGIN || '');
    const categories = menu.categories?.map((category) => `- ${category.title}`).join('\n') || '- دسته‌بندی ثبت نشده';
    const info = `اطلاعات مجموعه:
نام: ${shop.title || '-'}
توضیحات: ${shop.description || '-'}
آدرس سایت: ${appUrl}
دسته‌بندی‌ها:
${categories}`;

    return { info, menu };
  }

  private getProductKnowledgeForCandidates(products: Product[]): ShopAiKnowledge {
    if (!products.length) {
      return {
        info: `محصول مرتبطی با پیام کاربر پیدا نشد. از کاربر بخواه سوالش را دقیق‌تر بپرسد.
لیست محصولات مرتبط:
`,
        productsByIndex: [],
      };
    }

    const info = `لیست محصولات مرتبط:
${products.map((product, index) => this.formatProductKnowledge(product, index)).join('\n')}`;

    return { info, productsByIndex: products.map((product) => ({ id: product.id, title: product.title })) };
  }

  private formatProductKnowledge(product: Product, index: number) {
    const parts = [
      `- ${product.title} (شماره محصول: ${index + 1})`,
      `دسته: ${product.category?.title || 'بدون دسته'}`,
    ];

    parts.push(this.formatProductPrice(product));

    return parts.join(' | ');
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
