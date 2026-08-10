import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaleBotKeys, Club, Member, Shop, ThirdPartyApp, User, UserRole, Status } from '@menno/types';
import { PersianNumberService } from '@menno/utils';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { AiChatbotService } from '../ai-chatbot/ai-chatbot.service';

interface BaleBotRuntime {
  shop: Shop;
  token: string;
  interval?: NodeJS.Timeout;
  offset: number;
  pollInFlight: boolean;
  /** When true, updates arrive via setWebhook POST; no getUpdates polling. */
  useWebhook: boolean;
}

interface BaleFrom {
  id: number;
  /** Bale profile display name as a single string (do not split with last_name). */
  first_name?: string;
  username?: string;
}

interface BaleContact {
  phone_number?: string;
  user_id?: number;
}

interface BaleMessage {
  text?: string;
  from?: BaleFrom;
  contact?: BaleContact;
}

interface BaleChat {
  id: number;
}

interface BaleUpdate {
  update_id?: number;
  updateId?: number;
  message?: BaleMessage & {
    chat: BaleChat;
  };
}

interface BaleTelegramResponse<T = unknown> {
  ok?: boolean;
  result?: T;
  description?: string;
}

@Injectable()
export class BaleBotsService implements OnModuleInit, OnModuleDestroy {
  private readonly apiBaseUrl = 'https://tapi.bale.ai';
  private readonly runtimes = new Map<string, BaleBotRuntime>();

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Member)
    private readonly membersRepo: Repository<Member>,
    private readonly aiChatbotService: AiChatbotService,
  ) {}

  async onModuleInit() {
    await this.reloadAllBots();
  }

  async onModuleDestroy() {
    this.stopAllBots();
  }

  async reloadAllBots() {
    this.stopAllBots();

    const shops = await this.shopRepo.find({
      relations: ['thirdParties', 'aiChatbot'],
    });

    for (const shop of shops) {
      const baleParty = shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale && !!item.token);
      if (!baleParty?.token) continue;

      await this.startBotForShop(shop, baleParty.token);
    }

  }

  async reloadShopBots(shopId: string) {
    this.stopBotByShopId(shopId);

    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['thirdParties', 'aiChatbot'],
    });
    if (!shop) return;

    const baleParty = shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale && !!item.token);
    if (!baleParty?.token) return;

    await this.startBotForShop(shop, baleParty.token);
  }

  /** Refresh in-memory shop (e.g. aiChatbot status) without restarting polling/webhook. */
  async refreshShopRuntime(shopId: string) {
    const runtime = this.runtimes.get(shopId);
    if (!runtime) return;

    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['thirdParties', 'aiChatbot'],
    });
    if (!shop) {
      this.stopBotByShopId(shopId);
      return;
    }

    const baleParty = shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale && !!item.token);
    if (!baleParty?.token) {
      this.stopBotByShopId(shopId);
      return;
    }

    runtime.shop = shop;
    runtime.token = baleParty.token;
  }

  /** Called by {@link BaleWebhookController} when Bale POSTs an update. */
  async handleIncomingWebhook(shopId: string, body: unknown): Promise<void> {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['thirdParties', 'aiChatbot'],
    });
    if (!shop) {
      return;
    }
    const baleParty = shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale && !!item.token);
    if (!baleParty?.token) return;

    const runtime: BaleBotRuntime = {
      shop,
      token: baleParty.token,
      offset: 0,
      pollInFlight: false,
      useWebhook: true,
    };
    await this.handleUpdate(runtime, body as BaleUpdate);
  }

  private async startBotForShop(shop: Shop, token: string) {
    const webhookUrl = this.buildWebhookUrl(shop.id);
    const runtime: BaleBotRuntime = {
      shop,
      token,
      offset: 0,
      pollInFlight: false,
      useWebhook: false,
    };
    this.runtimes.set(shop.id, runtime);

    if (webhookUrl) {
      try {
        await this.invokeSetWebhook(token, webhookUrl);
        runtime.useWebhook = true;
        return;
      } catch (e: unknown) {
        if ((e as any)?.response?.status === 401) {
          this.stopBotByShopId(shop.id);
          return;
        }
        await this.invokeSetWebhook(token, '').catch(() => undefined);
      }
    } else {
      try {
        await this.invokeSetWebhook(token, '');
      } catch (e: unknown) {
        if ((e as any)?.response?.status === 401) {
          this.stopBotByShopId(shop.id);
          return;
        }
      }
    }

    this.startPolling(runtime);
  }

  private startPolling(runtime: BaleBotRuntime) {
    void this.pollUpdates(runtime.shop.id).catch(() => {});

    runtime.interval = setInterval(() => {
      this.pollUpdates(runtime.shop.id).catch(() => {});
    }, 2000);
  }

  /**
   * Full HTTPS URL Bale will POST updates to: `{API_BASE_URL}/webhooks/bale/{shopId}?secret=...`.
   * Uses `API_BASE_URL` (https, no trailing slash) and `BALE_WEBHOOK_SECRET` (query `secret`).
   */
  private buildWebhookUrl(shopId: string): string | undefined {
    const base = (process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');
    const secret = (process.env.BALE_WEBHOOK_SECRET || '').trim();
    if (!base.startsWith('https://')) {
      return undefined;
    }
    if (!secret) {
      return undefined;
    }
    return `${base}/webhooks/bale/${encodeURIComponent(shopId)}?secret=${encodeURIComponent(secret)}`;
  }

  private async invokeSetWebhook(token: string, url: string): Promise<void> {
    const body = (await this.postBale(token, 'setWebhook', { url })) as BaleTelegramResponse<boolean>;
    if (body?.ok === false) {
      throw new Error(body.description || 'setWebhook failed');
    }
  }

  private stopAllBots() {
    for (const shopId of this.runtimes.keys()) {
      this.stopBotByShopId(shopId);
    }
  }

  private stopBotByShopId(shopId: string) {
    const runtime = this.runtimes.get(shopId);
    if (!runtime) return;

    if (runtime.interval) {
      clearInterval(runtime.interval);
    }
    if (runtime.useWebhook) {
      void this.invokeSetWebhook(runtime.token, '').catch(() => undefined);
    }
    this.runtimes.delete(shopId);
  }

  private async pollUpdates(shopId: string) {
    const runtime = this.runtimes.get(shopId);
    if (!runtime || runtime.pollInFlight || runtime.useWebhook) return;

    runtime.pollInFlight = true;
    try {
      let raw: unknown;
      try {
        raw = await this.postBale(runtime.token, 'getUpdates', {
          timeout: 1,
          offset: runtime.offset,
        });
      } catch (err: unknown) {
        if ((err as any)?.response?.status === 401) {
          this.stopBotByShopId(shopId);
        }
        return;
      }

      if (raw && typeof raw === 'object' && 'ok' in raw && (raw as BaleTelegramResponse).ok === false) {
        return;
      }

      const updates = this.unwrapUpdates(raw);

      for (const update of updates) {
        const updateId = update.update_id ?? update.updateId;
        if (typeof updateId !== 'number') continue;
        runtime.offset = updateId + 1;
        try {
          await this.handleUpdate(runtime, update);
        } catch (error: unknown) {
        }
      }
    } finally {
      runtime.pollInFlight = false;
    }
  }

  private unwrapUpdates(raw: unknown): BaleUpdate[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'result' in raw) {
      const r = (raw as BaleTelegramResponse<BaleUpdate[]>).result;
      return Array.isArray(r) ? r : [];
    }
    return [];
  }

  private async handleUpdate(runtime: BaleBotRuntime, update: BaleUpdate) {
    const msg = update.message;
    if (!msg?.chat?.id) return;
    const chatId = msg.chat.id;
    const fromId = msg.from?.id;
    if (fromId === undefined || fromId === null) return;
    const baleIdStr = String(fromId);
    const traceId = this.createBaleTraceId(runtime.shop.id, chatId);


    if (this.isStartCommand(msg.text)) {
      await this.sendWelcomeMessage(runtime, chatId);
      return;
    }

    if (msg.contact?.phone_number) {
      const contactUserId = msg.contact.user_id;
      const ownContact =
        contactUserId === undefined || contactUserId === null || Number(contactUserId) === Number(fromId);
      if (!ownContact) {
        await this.sendPlainText(
          runtime,
          chatId,
          'لطفاً فقط شمارهٔ خودتان را با دکمهٔ «ارسال شماره تماس» بفرستید.',
          this.requestContactKeyboard(),
        );
        return;
      }
      const phone = this.normalizeIranPhone(msg.contact.phone_number);
      let user = await this.findAppUserByMobile(phone);
      if (!user) {
        const created = new User();
        created.mobilePhone = phone;
        created.role = UserRole.App;
        const displayName = this.displayNameFromBale(msg.from);
        if (displayName) {
          created.firstName = displayName;
        }
        user = await this.usersRepo.save(created);
      }
      await this.usersRepo
        .createQueryBuilder()
        .update(User)
        .set({ baleId: null })
        .where('baleId = :bid', { bid: baleIdStr })
        .andWhere('id != :uid', { uid: user.id })
        .execute();
      const userPatch: Partial<User> = { baleId: baleIdStr };
      const hasStoredName =
        (user.firstName && user.firstName.trim()) || (user.lastName && user.lastName.trim());
      if (!hasStoredName) {
        const fromBale = this.displayNameFromBale(msg.from);
        if (fromBale) {
          userPatch.firstName = fromBale;
        }
      }
      await this.usersRepo.update(user.id, userPatch);
      await this.ensureMemberJoinedToShopClub(runtime.shop, user.id);
      await this.callBotApiExpectOk(runtime.token, 'sendMessage', {
        chat_id: chatId,
        text: 'حساب شما به بازو متصل شد.',
        reply_markup: { remove_keyboard: true },
      });
      await this.sendWelcomeMessage(runtime, chatId);
      return;
    }

    const linked = await this.usersRepo.findOneBy({ baleId: baleIdStr });

    if (linked) {
      if (runtime.shop.aiChatbot?.status === Status.Active) {
        let result: Awaited<ReturnType<AiChatbotService['chat']>>;
        const stopChatAction = this.startChatActionLoop(runtime, chatId, traceId);
        try {
          result = await this.aiChatbotService.chat(runtime.shop.id, linked.id, msg.text || '', undefined, traceId);
        } catch (error) {
          if (this.isPaymentRequiredError(error)) {
            await this.sendWelcomeMessage(runtime, chatId);
            return;
          }
          await this.sendPlainText(runtime, chatId, 'متاسفانه در تولید پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.');
          return;
        } finally {
          stopChatAction();
        }

        let reply_markup;
        if (result.products?.length > 0) {
          const origin = process.env.APP_ORIGIN || '';
          reply_markup = { inline_keyboard: [] };

          result.products.forEach((product) => {
            const pUrl = Shop.productLink(runtime.shop, product.id, origin);
            reply_markup.inline_keyboard.push([
              { text: this.truncate(product.title || 'مشاهده و سفارش محصول', 64), web_app: { url: pUrl } },
            ]);
          });
        }
        try {
          await this.sendPlainText(runtime, chatId, result.text, reply_markup);
        } catch (error) {
          await this.sendPlainText(runtime, chatId, this.stripMarkdown(result.text));
        }
        return;
      }
      await this.sendWelcomeMessage(runtime, chatId);
      return;
    }

    await this.sendPlainText(
      runtime,
      chatId,
      'برای ادامه، شمارهٔ تماس خود را با دکمهٔ زیر ارسال کنید.',
      this.requestContactKeyboard(),
    );
  }

  private requestContactKeyboard() {
    return {
      keyboard: [[{ text: 'ارسال شماره تماس', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  private isStartCommand(text?: string) {
    return text?.trim().split(/\s+/)[0] === '/start';
  }

  private isPaymentRequiredError(error: unknown) {
    return error instanceof HttpException && error.getStatus() === HttpStatus.PAYMENT_REQUIRED;
  }

  private async sendPlainText(
    runtime: BaleBotRuntime,
    chatId: number,
    text: string,
    reply_markup?: Record<string, unknown>,
  ) {
    await this.callBotApiExpectOk(runtime.token, 'sendMessage', {
      chat_id: chatId,
      text: this.truncate(text, 4096),
      ...(reply_markup ? { reply_markup } : {}),
    });
  }

  private async sendChatAction(runtime: BaleBotRuntime, chatId: number, traceId: string) {
    try {
      await this.callBotApiExpectOk(runtime.token, 'sendChatAction', {
        chat_id: chatId,
        action: 'typing',
      });
    } catch (error) {
    }
  }

  private startChatActionLoop(runtime: BaleBotRuntime, chatId: number, traceId: string) {
    this.sendChatAction(runtime, chatId, traceId);
    const interval = setInterval(() => {
      this.sendChatAction(runtime, chatId, traceId);
    }, 3500);

    return () => {
      clearInterval(interval);
    };
  }

  private normalizeIranPhone(raw: string): string {
    let p = PersianNumberService.toEnglish(raw.trim()).replace(/[\s\-()]/g, '');
    if (p.startsWith('00')) p = p.slice(2);
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('98') && p.length > 2) p = '0' + p.slice(2);
    if (/^9\d{9}$/.test(p)) p = '0' + p;
    return p;
  }

  /** Single-line display name from Bale (`first_name` only, then username). */
  private displayNameFromBale(from?: BaleFrom): string {
    if (!from) return '';
    const name = from.first_name?.trim();
    if (name) return name;
    return from.username?.trim() || '';
  }

  private async findAppUserByMobile(digits: string): Promise<User | null> {
    if (!digits) return null;
    const candidates = new Set<string>();
    candidates.add(digits);
    if (digits.startsWith('98') && digits.length > 2) {
      candidates.add('0' + digits.slice(2));
      candidates.add(digits.slice(2));
    }
    if (digits.startsWith('0')) {
      candidates.add('98' + digits.slice(1));
    }
    for (const m of candidates) {
      const u = await this.usersRepo.findOneBy({ mobilePhone: m });
      if (u) return u;
    }
    return null;
  }

  private async ensureMemberJoinedToShopClub(shop: Shop, userId: string): Promise<void> {
    const clubId = shop.club?.id;
    if (!clubId) return;

    const existingMember = await this.membersRepo.findOne({
      where: {
        user: { id: userId },
        club: { id: clubId },
      },
      withDeleted: true,
    });
    if (existingMember) {
      if (existingMember.deletedAt) {
        await this.membersRepo.restore(existingMember.id);
      }
      return;
    }

    const newMember = new Member();
    newMember.club = <Club>{ id: clubId };
    newMember.user = <User>{ id: userId };
    await this.membersRepo.save(newMember);
  }

  private async sendWelcomeMessage(runtime: BaleBotRuntime, chatId: number) {
    const origin = process.env.APP_ORIGIN || '';
    const appUrl = Shop.appLink(runtime.shop, origin);
    const keys = runtime.shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale)?.keys as BaleBotKeys;

    const baseMessage = keys?.start?.message || `برای شروع سفارش از لینک زیر استفاده کنید:\n${appUrl}`;
    const buttonText = (
      keys?.start?.buttonText ||
      keys?.start?.primaryButtonText ||
      'ورود به سایت'
    ).slice(0, 64);

    const imageUrl = keys?.start?.imageUrl?.trim();
    const message = baseMessage;

    const reply_markup = this.buildInlineKeyboard(buttonText, appUrl);

    const trySendText = async (text: string, markup?: typeof reply_markup) => {
      await this.callBotApiExpectOk(runtime.token, 'sendMessage', {
        chat_id: chatId,
        text: this.truncate(text, 4096),
        ...(markup ? { reply_markup: markup } : {}),
      });
    };

    try {
      if (imageUrl) {
        const caption = this.truncate(message, 1024);
        try {
          await this.callBotApiExpectOk(runtime.token, 'sendPhoto', {
            chat_id: chatId,
            photo: imageUrl,
            caption,
            ...(reply_markup ? { reply_markup } : {}),
          });
        } catch (photoErr: unknown) {
          await trySendText(message, reply_markup);
        }
      } else {
        await trySendText(message, reply_markup);
      }
    } catch (err: unknown) {
      const fallback = this.truncate(`${message}\n\n${appUrl}`, 4096);
      await trySendText(fallback, undefined);
    }
  }

  private buildInlineKeyboard(buttonText: string, appUrl: string) {
    const href = appUrl?.trim();
    if (!buttonText || !this.isValidHttpUrl(href)) {
      return undefined;
    }
    // `url` opens in the system browser; `web_app` opens inside Bale as a mini app (see InlineKeyboardButton / WebAppInfo in Bale API).
    try {
      if (new URL(href).protocol === 'https:') {
        return {
          inline_keyboard: [[{ text: buttonText, web_app: { url: href } }]],
        };
      }
    } catch {
      return undefined;
    }
    return {
      inline_keyboard: [[{ text: buttonText, url: href }]],
    };
  }

  private isValidHttpUrl(url: string): boolean {
    const t = url?.trim();
    if (!t) return false;
    try {
      const u = new URL(t);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  }

  private truncate(s: string, max: number): string {
    if (!s || s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
  }

  private stripMarkdown(text: string): string {
    return text.replace(/[*_]/g, '');
  }

  private createBaleTraceId(shopId: string, chatId: number) {
    return `bale-${shopId.slice(0, 8)}-${chatId}-${Date.now().toString(36)}`;
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

  private async postBale(token: string, method: string, data: Record<string, unknown>): Promise<unknown> {
    const url = `${this.apiBaseUrl}/bot${token}/${method}`;
    const response = await firstValueFrom(this.http.post<unknown>(url, data));
    return response.data;
  }

  private async callBotApiExpectOk(token: string, method: string, data: Record<string, unknown>): Promise<void> {
    const body = await this.postBale(token, method, data);
    if (body && typeof body === 'object' && 'ok' in body && (body as BaleTelegramResponse).ok === false) {
      const desc = (body as BaleTelegramResponse).description || 'Bale API error';
      throw new Error(desc);
    }
  }
}
