import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MennoBaleOrderKeys,
  Order,
  OrderItem,
  OrderState,
  OrderType,
  ThirdPartyApp,
  User,
} from '@menno/types';
import { PersianNumberService } from '@menno/utils';
import { firstValueFrom } from 'rxjs';
import { QueryRunner, Repository } from 'typeorm';

export interface MennoBaleSyncContext {
  /** In-memory line items on insert (DB rows may not exist yet) */
  items?: OrderItem[];
}

interface PendingMennoBaleSync {
  allowCreate: boolean;
  items?: OrderItem[];
}

export type MennoBaleSyncAction = 'edited' | 'sent';

export type MennoBaleSyncResult =
  | { ok: true; action: MennoBaleSyncAction }
  | { ok: false; skipReason?: string; error?: string };

interface BaleTelegramResponse<T = unknown> {
  ok?: boolean;
  result?: T;
  description?: string;
}

const ORDER_STATE_FA: Record<OrderState, string> = {
  [OrderState.Canceled]: 'لغو شده',
  [OrderState.Pending]: 'در انتظار',
  [OrderState.Processing]: 'در حال آماده‌سازی',
  [OrderState.Shipping]: 'در حال ارسال',
  [OrderState.Completed]: 'تکمیل شده',
  [OrderState.Ready]: 'آماده تحویل',
};

/** Emoji + label shown once at the end of the channel message */
const ORDER_STATE_LINE: Record<OrderState, string> = {
  [OrderState.Canceled]: '❌ لغو شده',
  [OrderState.Pending]: '⏳ در انتظار',
  [OrderState.Processing]: '👨‍🍳 در حال آماده‌سازی',
  [OrderState.Shipping]: '🚚 در حال ارسال',
  [OrderState.Completed]: '✅ تکمیل شده',
  [OrderState.Ready]: '📦 آماده تحویل',
};

/**
 * Uses env `MENNO_BALE_ORDERS_BOT_TOKEN` (Menno shared Bale bot) and `NEW_PANEL_BASE_URL` for the panel link button.
 * Per shop: only {@link MennoBaleOrderKeys.channelId} on {@link ThirdPartyApp.MennoBaleOrders}.
 * Message text is implicit Markdown on Bale (no parse_mode). Section headers use Bale bold (space around *…*). Lines use {@link sanitizeUserText} for user-supplied fragments.
 * New Bale channel posts only from {@code Order} {@code afterInsert} ({@code allowCreate} true). Updates use {@code afterUpdate} / item changes.
 */
@Injectable()
export class MennoBaleOrderNotificationsService {
  private readonly logger = new Logger(MennoBaleOrderNotificationsService.name);
  private readonly apiBaseUrl = 'https://tapi.bale.ai';
  private readonly pendingByRunner = new WeakMap<QueryRunner, Map<string, PendingMennoBaleSync>>();

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
  ) {}

  /**
   * From TypeORM subscribers: queue until {@link flushPendingSyncs} on commit.
   * Avoids "Query runner already released" when sync runs async while the transaction is open.
   */
  scheduleSyncAfterCommit(
    orderId: string,
    allowCreate: boolean,
    queryRunner: QueryRunner | undefined,
    items?: OrderItem[],
  ): void {
    if (!orderId) return;

    if (queryRunner?.isTransactionActive) {
      let pending = this.pendingByRunner.get(queryRunner);
      if (!pending) {
        pending = new Map();
        this.pendingByRunner.set(queryRunner, pending);
      }
      const prev = pending.get(orderId);
      pending.set(orderId, {
        allowCreate: prev?.allowCreate === true || allowCreate,
        items: items?.length ? items : prev?.items,
      });
      this.logger.debug(`Menno Bale queued until commit order=${orderId} allowCreate=${allowCreate}`);
      return;
    }

    void this.runSyncInBackground(orderId, allowCreate, items?.length ? { items } : undefined);
  }

  flushPendingSyncs(queryRunner: QueryRunner): void {
    const pending = this.pendingByRunner.get(queryRunner);
    if (!pending?.size) return;
    this.pendingByRunner.delete(queryRunner);
    for (const [orderId, { allowCreate, items }] of pending) {
      this.logger.debug(`Menno Bale flush after commit order=${orderId} allowCreate=${allowCreate}`);
      void this.runSyncInBackground(orderId, allowCreate, items?.length ? { items } : undefined);
    }
  }

  private runSyncInBackground(orderId: string, allowCreate: boolean, ctx?: MennoBaleSyncContext): void {
    void this.syncOrderChannelMessage(orderId, allowCreate, ctx).catch((error: unknown) => {
      this.logger.warn(`Menno Bale sync failed order=${orderId}: ${(error as Error)?.message || error}`);
    });
  }

  async syncOrderChannelMessage(
    orderId: string,
    allowCreate = true,
    ctx?: MennoBaleSyncContext,
  ): Promise<MennoBaleSyncResult> {
    this.logger.debug(`Menno Bale sync start order=${orderId} allowCreate=${allowCreate}`);

    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['shop', 'shop.thirdParties', 'customer', 'address', 'address.region'],
      withDeleted: true,
    });
    if (!order) {
      this.logger.log(`[Menno Bale] skip order=${orderId}: order not found`);
      return { ok: false, skipReason: 'order not found' };
    }
    if (!order.shop) {
      this.logger.log(`[Menno Bale] skip order=${orderId}: shop missing on order`);
      return { ok: false, skipReason: 'shop missing on order' };
    }
    if (!order.shop.thirdParties?.length) {
      this.logger.log(`[Menno Bale] skip order=${orderId} shop=${order.shop.id}: no thirdParties`);
      return { ok: false, skipReason: 'no thirdParties' };
    }

    if (ctx?.items?.length) {
      order.items = ctx.items;
      this.logger.debug(`Menno Bale sync order=${orderId}: using ${ctx.items.length} in-memory item(s)`);
    } else {
      const itemRows = await this.orderItemsRepo.find({
        where: { order: { id: orderId } },
        order: { id: 'ASC' },
      });
      order.items = itemRows;
      this.logger.debug(`Menno Bale sync order=${orderId}: loaded ${itemRows.length} item(s)`);
    }

    const latest = await this.ordersRepo.findOne({ where: { id: orderId }, withDeleted: true });
    if (latest) {
      order.state = latest.state;
      order.totalPrice = latest.totalPrice;
      order.note = latest.note;
      order.deletedAt = latest.deletedAt;
      order.details = latest.details;
      order.type = latest.type;
      order.mennoBaleChannelMessageId = latest.mennoBaleChannelMessageId;
      order.mennoBaleNotifyChannelId = latest.mennoBaleNotifyChannelId;
    }

    const party = order.shop.thirdParties.find((t) => t.app === ThirdPartyApp.MennoBaleOrders);
    const keys = party?.keys as MennoBaleOrderKeys | undefined;
    const channelId = keys?.channelId?.trim();
    const botToken = (process.env.MENNO_BALE_ORDERS_BOT_TOKEN || '').trim();
    if (!party) {
      this.logger.log(
        `[Menno Bale] skip order=${orderId} shop=${order.shop.id}: mennoBaleOrders not configured (apps=${order.shop.thirdParties.map((t) => t.app).join(',')})`,
      );
      return { ok: false, skipReason: 'mennoBaleOrders not configured' };
    }
    if (!channelId) {
      this.logger.log(`[Menno Bale] skip order=${orderId} shop=${order.shop.id}: channelId empty`);
      return { ok: false, skipReason: 'channelId empty' };
    }
    if (!botToken) {
      this.logger.log(`[Menno Bale] skip order=${orderId}: MENNO_BALE_ORDERS_BOT_TOKEN not set`);
      return { ok: false, skipReason: 'MENNO_BALE_ORDERS_BOT_TOKEN not set' };
    }

    const text = this.formatOrderMessage(order);
    const reply_markup = this.buildPanelOrderReplyMarkup(orderId);
    const chatId = this.parseChatId(channelId);
    if (chatId === undefined) {
      this.logger.warn(`Menno Bale orders: invalid channelId "${channelId}" order=${orderId}`);
      return { ok: false, skipReason: 'invalid channelId' };
    }

    const msgId = order.mennoBaleChannelMessageId;
    const channelMatches =
      !order.mennoBaleNotifyChannelId || order.mennoBaleNotifyChannelId === channelId;

    this.logger.debug(
      `Menno Bale sync order=${orderId} shop=${order.shop.id} channelId=${channelId} msgId=${msgId ?? 'none'} channelMatches=${channelMatches} state=${order.state} deleted=${!!order.deletedAt}`,
    );

    if (msgId != null && msgId > 0 && channelMatches) {
      try {
        await this.callBotApi(botToken, 'editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text,
          ...(reply_markup ? { reply_markup } : {}),
        });
        this.logger.debug(`Menno Bale sync order=${orderId}: editMessageText ok msgId=${msgId}`);
        return { ok: true, action: 'edited' };
      } catch (e: unknown) {
        const errText = String((e as Error)?.message || e);
        const canResend =
          /message (not found|to edit)|message id invalid|MESSAGE_ID_INVALID|message_id_invalid|chat not found/i.test(
            errText,
          );
        if (!canResend) {
          this.logger.warn(
            `Menno Bale editMessageText failed order=${orderId} allowCreate=${allowCreate}: ${errText}`,
          );
          return { ok: false, error: errText };
        }
        this.logger.warn(`Menno Bale editMessageText lost message order=${orderId}, sending new: ${errText}`);
      }
    } else if (msgId != null && msgId > 0 && !channelMatches) {
      this.logger.debug(
        `Menno Bale orders: channel changed for shop order=${orderId} stored=${order.mennoBaleNotifyChannelId} current=${channelId}, will post new message`,
      );
    }

    if (!allowCreate) {
      this.logger.log(
        `[Menno Bale] skip sendMessage order=${orderId}: allowCreate=false, no channel card yet (msgId=${msgId ?? 'none'})`,
      );
      return { ok: false, skipReason: 'no channel card yet' };
    }

    try {
      this.logger.debug(`Menno Bale sync order=${orderId}: sendMessage chatId=${chatId}`);
      const body = await this.postBale(botToken, 'sendMessage', {
        chat_id: chatId,
        text,
        ...(reply_markup ? { reply_markup } : {}),
      }) as BaleTelegramResponse<{ message_id?: number }>;
      if (body?.ok === false) {
        throw new Error(body.description || 'sendMessage failed');
      }
      const newId = body?.result?.message_id;
      if (typeof newId === 'number' && newId > 0) {
        await this.ordersRepo.update(orderId, {
          mennoBaleChannelMessageId: newId,
          mennoBaleNotifyChannelId: channelId,
        });
        this.logger.debug(`Menno Bale sync order=${orderId}: sendMessage ok saved msgId=${newId}`);
        return { ok: true, action: 'sent' };
      }
      this.logger.log(
        `[Menno Bale] sendMessage ok but no message_id order=${orderId} (ok=${body?.ok}) — card not saved`,
      );
      return { ok: false, error: 'sendMessage returned no message_id' };
    } catch (e: unknown) {
      const errText = String((e as Error)?.message || e);
      this.logger.warn(`Menno Bale sendMessage failed order=${orderId}: ${errText}`);
      return { ok: false, error: errText };
    }
  }

  /** Bale bold: space before opening * and after closing * (see Bale Markdown rules). */
  private baleBoldHeader(label: string): string {
    return ` *${label}* `;
  }

  /**
   * Item lines are plain checklist-style (not bold). Headers bold. Digits normalized at the end.
   */
  private formatOrderMessage(order: Order): string {
    const parts: string[] = [];

    const items = (order.items || []).filter((i) => !i.isAbstract);
    parts.push(this.baleBoldHeader('📋 اقلام'));
    if (items.length) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const raw = (it.title || '—').replace(/\s+/g, ' ').trim();
        const maxTitle = 120;
        const short = raw.length > maxTitle ? `${raw.slice(0, maxTitle - 1)}…` : raw;
        const title = this.sanitizeUserText(short);
        parts.push(`- [ ] ${title} | ${String(it.quantity ?? 1)} عدد`);
      }
    } else {
      parts.push('—');
    }

    parts.push(` *جمع کل:* ${this.sanitizeUserText(PersianNumberService.withCommas(order.totalPrice))}`);

    const c = order.customer;
    parts.push('', this.baleBoldHeader('👤 مشتری'));
    if (c) {
      parts.push(this.sanitizeUserText(User.fullName(c) || '—'));
      parts.push(this.sanitizeUserText(c.mobilePhone || order.details?.customerPhone || '—'));
    } else {
      parts.push('—');
      if (order.details?.customerPhone) parts.push(this.sanitizeUserText(order.details.customerPhone));
    }

    parts.push('', this.baleBoldHeader('📍 آدرس'));
    const addr = order.address;
    if (addr) {
      const r = addr.region;
      const regionLine = [r?.state, r?.title]
        .map((s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''))
        .filter((s) => s.length > 0)
        .join('، ');

      const streetParts: string[] = [];
      if (addr.description?.trim()) streetParts.push(addr.description.replace(/\s+/g, ' ').trim());
      if (addr.ring?.trim()) streetParts.push(`پلاک ${addr.ring.replace(/\s+/g, ' ').trim()}`);
      if (addr.unit?.trim()) streetParts.push(`واحد ${addr.unit.replace(/\s+/g, ' ').trim()}`);
      const streetLine = streetParts.join(' ');

      const postal = addr.postalCode?.replace(/\s+/g, ' ').trim();
      const chunks: string[] = [];
      if (regionLine) chunks.push(regionLine);
      if (streetLine) chunks.push(streetLine);
      if (postal) chunks.push(`کدپستی: ${postal}`);

      if (!chunks.length) {
        parts.push('—');
      } else {
        for (let i = 0; i < chunks.length; i++) {
          if (i > 0) parts.push('');
          parts.push(this.sanitizeUserText(chunks[i]));
        }
      }
    } else {
      switch (order.type) {
        case OrderType.DineIn:
          parts.push(
            this.sanitizeUserText(
              order.details?.table ? `میز: ${order.details.table}` : 'حضوری در مجموعه',
            ),
          );
          break;
        default:
          parts.push('—');
      }
    }

    if (order.note?.trim()) {
      parts.push('', this.baleBoldHeader('📝 یادداشت'), this.sanitizeUserText(order.note.trim()));
    }

    const stateNum = Number(order.state) as OrderState;
    const stateLine = order.deletedAt
      ? '🗑️ حذف از پنل'
      : ORDER_STATE_LINE[stateNum] ?? `❔ ${ORDER_STATE_FA[stateNum] ?? String(order.state)}`;
    const footer = `\n\n──────────\n${stateLine}`;

    const body = parts.join('\n');
    const full = body + footer;
    if (full.length > 4090) {
      this.logger.warn(`Menno Bale order message too long order=${order.id}`);
    }
    return PersianNumberService.toEnglish(full);
  }

  /** Avoid breaking Bale’s implicit Markdown in product titles, addresses, names, etc. */
  private sanitizeUserText(s: string): string {
    if (s == null || s === '') return '';
    return String(s)
      .replace(/\\/g, '＼')
      .replace(/\*/g, '٭')
      .replace(/_/g, '＿')
      .replace(/`/g, 'ʽ')
      .replace(/\[/g, '［')
      .replace(/\]/g, '］')
      .replace(/~/g, '～');
  }

  /** Inline URL button → new-panel order details (`/orders/details/:id`). */
  private buildPanelOrderReplyMarkup(orderId: string): { inline_keyboard: { text: string; url: string }[][] } | undefined {
    const url = this.buildPanelOrderDetailsUrl(orderId);
    if (!url) return undefined;
    return {
      inline_keyboard: [[{ text: 'جزئیات در پنل', url }]],
    };
  }

  private buildPanelOrderDetailsUrl(orderId: string): string | undefined {
    const raw = (process.env.NEW_PANEL_BASE_URL?.trim() || '').replace(/\/+$/, '');
    if (!raw) return undefined;
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let base: string;
    try {
      const u = new URL(withScheme);
      base = `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
    } catch {
      return undefined;
    }
    const path = `/orders/details/${encodeURIComponent(orderId)}`;
    const full = `${base}${path}`;
    if (full.length > 2048) return undefined;
    try {
      const u = new URL(full);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined;
      return full;
    } catch {
      return undefined;
    }
  }

  private parseChatId(raw: string): number | string | undefined {
    const t = raw.trim();
    if (!t) return undefined;
    if (/^-?\d+$/.test(t)) {
      const n = Number(t);
      if (Number.isSafeInteger(n)) return n;
      return t;
    }
    return t;
  }

  private async postBale(token: string, method: string, data: Record<string, unknown>): Promise<unknown> {
    const url = `${this.apiBaseUrl}/bot${token}/${method}`;
    const response = await firstValueFrom(this.http.post<unknown>(url, data));
    return response.data;
  }

  private async callBotApi(token: string, method: string, data: Record<string, unknown>): Promise<void> {
    const body = await this.postBale(token, method, data);
    if (body && typeof body === 'object' && 'ok' in body && (body as BaleTelegramResponse).ok === false) {
      throw new Error((body as BaleTelegramResponse).description || 'Bale API error');
    }
  }
}
