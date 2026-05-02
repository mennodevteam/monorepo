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
import { Repository } from 'typeorm';

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
 */
@Injectable()
export class MennoBaleOrderNotificationsService {
  private readonly logger = new Logger(MennoBaleOrderNotificationsService.name);
  private readonly apiBaseUrl = 'https://tapi.bale.ai';

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
  ) {}

  /** Fire-and-forget after DB commit so items/state match the latest save. */
  scheduleSyncOrderChannelMessage(orderId: string): void {
    setImmediate(() => {
      void this.syncOrderChannelMessage(orderId).catch((err: unknown) => {
        this.logger.warn(`Menno Bale orders sync failed order=${orderId}: ${(err as Error)?.message || err}`);
      });
    });
  }

  async syncOrderChannelMessage(orderId: string): Promise<void> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['shop', 'shop.thirdParties', 'customer', 'address', 'address.region'],
      withDeleted: true,
    });
    if (!order?.shop?.thirdParties?.length) return;

    const itemRows = await this.orderItemsRepo.find({
      where: { order: { id: orderId } },
      order: { id: 'ASC' },
    });
    order.items = itemRows;

    const latest = await this.ordersRepo.findOne({ where: { id: orderId }, withDeleted: true });
    if (latest) {
      order.state = latest.state;
      order.totalPrice = latest.totalPrice;
      order.note = latest.note;
      order.deletedAt = latest.deletedAt;
      order.details = latest.details;
      order.type = latest.type;
    }

    const party = order.shop.thirdParties.find((t) => t.app === ThirdPartyApp.MennoBaleOrders);
    const keys = party?.keys as MennoBaleOrderKeys | undefined;
    const channelId = keys?.channelId?.trim();
    const botToken = (process.env.MENNO_BALE_ORDERS_BOT_TOKEN || '').trim();
    if (!party || !channelId || !botToken) return;

    const text = this.formatOrderMessageHtml(order);
    const reply_markup = this.buildPanelOrderReplyMarkup(orderId);
    const parsePayload = { parse_mode: 'HTML' as const };
    const chatId = this.parseChatId(channelId);
    if (chatId === undefined) {
      this.logger.warn(`Menno Bale orders: invalid channelId "${channelId}"`);
      return;
    }

    const msgId = order.mennoBaleChannelMessageId;
    const channelMatches =
      !order.mennoBaleNotifyChannelId || order.mennoBaleNotifyChannelId === channelId;

    if (msgId != null && msgId > 0 && channelMatches) {
      try {
        await this.callBotApi(botToken, 'editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text,
          ...parsePayload,
          ...(reply_markup ? { reply_markup } : {}),
        });
        return;
      } catch (e: unknown) {
        const errText = String((e as Error)?.message || e);
        const canResend =
          /message (not found|to edit)|message id invalid|MESSAGE_ID_INVALID|message_id_invalid|chat not found/i.test(
            errText,
          );
        if (!canResend) {
          this.logger.warn(`Menno Bale editMessageText failed order=${orderId}: ${errText}`);
          return;
        }
        this.logger.warn(`Menno Bale editMessageText lost message order=${orderId}, sending new: ${errText}`);
      }
    } else if (msgId != null && msgId > 0 && !channelMatches) {
      this.logger.log(
        `Menno Bale orders: channel changed for shop order=${orderId}, posting new message instead of edit`,
      );
    }

    try {
      const body = await this.postBale(botToken, 'sendMessage', {
        chat_id: chatId,
        text,
        ...parsePayload,
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
      }
    } catch (e: unknown) {
      this.logger.warn(`Menno Bale sendMessage failed order=${orderId}: ${(e as Error)?.message || e}`);
    }
  }

  /**
   * Telegram/Bale HTML parse_mode: no real &lt;table&gt; support — use &lt;pre&gt; monospace grid.
   * @see https://core.telegram.org/bots/api#html-style
   */
  private formatOrderMessageHtml(order: Order): string {
    const parts: string[] = [];

    const items = (order.items || []).filter((i) => !i.isAbstract);
    const maxItemRows = 32;
    if (items.length) {
      const shown = items.length > maxItemRows ? items.slice(0, maxItemRows) : items;
      const overflow = items.length > maxItemRows ? `\n… (${items.length - maxItemRows} مورد دیگر)` : '';
      parts.push('<b>📋 اقلام</b>');
      parts.push(`<pre>${this.buildItemsTablePre(shown)}${overflow}</pre>`);
    } else {
      parts.push('<b>📋 اقلام</b>\n—');
    }

    parts.push(
      '',
      `<b>💰 جمع:</b> ${this.escapeHtml(PersianNumberService.withCommas(order.totalPrice))}`,
    );

    const c = order.customer;
    parts.push('', '<b>👤 مشتری</b>');
    if (c) {
      parts.push(this.escapeHtml(User.fullName(c) || '—'));
      parts.push(this.escapeHtml(c.mobilePhone || order.details?.customerPhone || '—'));
    } else {
      parts.push('—');
      if (order.details?.customerPhone) parts.push(this.escapeHtml(order.details.customerPhone));
    }

    parts.push('', '<b>📍 آدرس</b>');
    const addr = order.address;
    if (addr) {
      const r = addr.region;
      if (r?.state) parts.push(this.escapeHtml(`استان: ${r.state}`));
      if (r?.title) parts.push(this.escapeHtml(`شهر/منطقه: ${r.title}`));
      const line = [addr.description, addr.unit ? `واحد ${addr.unit}` : '', addr.ring ? `پلاک/زنگ ${addr.ring}` : '']
        .filter(Boolean)
        .join(' — ');
      parts.push(line ? this.escapeHtml(line) : '—');
    } else {
      switch (order.type) {
        case OrderType.DineIn:
          parts.push(
            this.escapeHtml(
              order.details?.table ? `میز: ${order.details.table}` : 'حضوری در مجموعه',
            ),
          );
          break;
        default:
          parts.push('—');
      }
    }

    if (order.note?.trim()) {
      parts.push('', `<b>📝 یادداشت</b>\n${this.escapeHtml(order.note.trim())}`);
    }

    const stateNum = Number(order.state) as OrderState;
    const stateLine = order.deletedAt
      ? '🗑️ حذف از پنل'
      : ORDER_STATE_LINE[stateNum] ?? `❔ ${ORDER_STATE_FA[stateNum] ?? String(order.state)}`;
    const footer = `\n\n<code>──────────</code>\n<b>${this.escapeHtml(stateLine)}</b>`;

    const bodyHtml = parts.join('\n');
    if (bodyHtml.length + footer.length > 4090) {
      this.logger.warn(`Menno Bale order message too long order=${order.id}; truncating item rows only`);
    }
    return bodyHtml + footer;
  }

  private buildItemsTablePre(items: OrderItem[]): string {
    const maxTitle = 36;
    const rows: string[] = [];
    rows.push('#  | محصول                              | تعداد', '---+------------------------------------+------');
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const raw = (it.title || '—').replace(/\s+/g, ' ').trim();
      const short = raw.length > maxTitle ? `${raw.slice(0, maxTitle - 1)}…` : raw;
      const title = this.escapeHtml(short);
      const q = String(it.quantity ?? 1);
      const n = String(i + 1).padStart(2, ' ');
      rows.push(`${n} | ${title} | ${q}`);
    }
    return rows.join('\n');
  }

  private escapeHtml(s: string): string {
    if (s == null || s === '') return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
