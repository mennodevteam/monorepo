import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaleBotKeys, Shop, ThirdPartyApp, User } from '@menno/types';
import { PersianNumberService } from '@menno/utils';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

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
  private readonly logger = new Logger(BaleBotsService.name);
  private readonly apiBaseUrl = 'https://tapi.bale.ai';
  private readonly runtimes = new Map<string, BaleBotRuntime>();

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
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
      relations: ['thirdParties'],
    });

    for (const shop of shops) {
      const baleParty = shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale && !!item.token);
      if (!baleParty?.token) continue;

      await this.startBotForShop(shop, baleParty.token);
    }

    this.logger.log(`Bale bots initialized: ${this.runtimes.size}`);
  }

  async reloadShopBots(shopId: string) {
    this.stopBotByShopId(shopId);

    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['thirdParties'],
    });
    if (!shop) return;

    const baleParty = shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale && !!item.token);
    if (!baleParty?.token) return;

    await this.startBotForShop(shop, baleParty.token);
  }

  /** Called by {@link BaleWebhookController} when Bale POSTs an update. */
  async handleIncomingWebhook(shopId: string, body: unknown): Promise<void> {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['thirdParties'],
    });
    if (!shop) {
      this.logger.warn(`Bale webhook: unknown shopId ${shopId}`);
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
        this.logger.log(`Bale setWebhook OK shop ${shop.id}`);
        return;
      } catch (e: unknown) {
        this.logger.warn(`Bale setWebhook failed shop ${shop.id}, clearing webhook and using polling: ${(e as Error)?.message}`);
        await this.invokeSetWebhook(token, '').catch(() => undefined);
      }
    } else {
      await this.invokeSetWebhook(token, '').catch(() => undefined);
    }

    this.startPolling(runtime);
  }

  private startPolling(runtime: BaleBotRuntime) {
    void this.pollUpdates(runtime.shop.id).catch((error) => {
      this.logger.error(`Bale bot initial poll failed for shop ${runtime.shop.id}: ${error?.message || error}`);
    });

    runtime.interval = setInterval(() => {
      this.pollUpdates(runtime.shop.id).catch((error) => {
        this.logger.error(`Bale bot poll failed for shop ${runtime.shop.id}: ${error?.message || error}`);
      });
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
      if (base) {
        this.logger.warn(
          'Bale setWebhook needs API_BASE_URL with https://; using long polling until it is HTTPS',
        );
      }
      return undefined;
    }
    if (!secret) {
      this.logger.warn('BALE_WEBHOOK_SECRET is not set; Bale bots use long polling only');
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
        this.logger.error(`Bale getUpdates HTTP error shop ${shopId}: ${(err as Error)?.message || err}`);
        return;
      }

      if (raw && typeof raw === 'object' && 'ok' in raw && (raw as BaleTelegramResponse).ok === false) {
        this.logger.warn(
          `Bale getUpdates for shop ${shopId}: ${(raw as BaleTelegramResponse).description || 'ok=false'}`,
        );
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
          this.logger.error(`Bale handle update ${updateId} shop ${shopId}: ${(error as Error)?.message || error}`);
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
      const user = await this.findAppUserByMobile(phone);
      if (!user) {
        await this.sendPlainText(
          runtime,
          chatId,
          'کاربری با این شماره در سیستم ما ثبت نشده است. ابتدا در سایت یا اپ مشتری ثبت‌نام کنید، سپس دوباره شماره را ارسال کنید.',
          this.requestContactKeyboard(),
        );
        return;
      }
      await this.usersRepo
        .createQueryBuilder()
        .update(User)
        .set({ baleId: null })
        .where('baleId = :bid', { bid: baleIdStr })
        .andWhere('id != :uid', { uid: user.id })
        .execute();
      await this.usersRepo.update(user.id, { baleId: baleIdStr });
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
      await this.sendWelcomeMessage(runtime, chatId);
      return;
    }

    await this.sendPlainText(
      runtime,
      chatId,
      'برای ادامه، شمارهٔ موبایلی که با آن در فروشگاه ثبت‌نام کرده‌اید را با دکمهٔ زیر ارسال کنید.',
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

  private normalizeIranPhone(raw: string): string {
    let p = PersianNumberService.toEnglish(raw.trim()).replace(/[\s\-()]/g, '');
    if (p.startsWith('00')) p = p.slice(2);
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('0') && p.length >= 10) p = '98' + p.slice(1);
    return p;
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
    let message =
      imageUrl && !baseMessage.includes(imageUrl) ? `${baseMessage}\n\n${imageUrl}`.trim() : baseMessage;

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
          this.logger.warn(
            `Bale sendPhoto failed shop ${runtime.shop.id}, fallback to text: ${(photoErr as Error)?.message}`,
          );
          message = this.truncate(`${message}\n\n(تصویر: ${imageUrl})`, 4096);
          await trySendText(message, reply_markup);
        }
      } else {
        await trySendText(message, reply_markup);
      }
    } catch (err: unknown) {
      this.logger.warn(`Bale send with keyboard failed, retry plain text: ${(err as Error)?.message}`);
      const fallback = this.truncate(`${message}\n\n${appUrl}`, 4096);
      await trySendText(fallback, undefined);
    }
  }

  private buildInlineKeyboard(buttonText: string, appUrl: string) {
    if (!buttonText || !this.isValidHttpUrl(appUrl)) {
      if (!this.isValidHttpUrl(appUrl)) {
        this.logger.warn(`Bale inline button skipped: invalid appUrl "${appUrl}"`);
      }
      return undefined;
    }
    return {
      inline_keyboard: [[{ text: buttonText, url: appUrl }]],
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
