import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MennoBaleOrderKeys,
  Order,
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
  ) {}

  /** Fire-and-forget safe entry from subscribers. */
  scheduleSyncOrderChannelMessage(orderId: string): void {
    void this.syncOrderChannelMessage(orderId).catch((err: unknown) => {
      this.logger.warn(`Menno Bale orders sync failed order=${orderId}: ${(err as Error)?.message || err}`);
    });
  }

  async syncOrderChannelMessage(orderId: string): Promise<void> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['shop', 'shop.thirdParties', 'items', 'customer', 'address', 'address.region'],
      withDeleted: true,
    });
    if (!order?.shop?.thirdParties?.length) return;

    const party = order.shop.thirdParties.find((t) => t.app === ThirdPartyApp.MennoBaleOrders);
    const keys = party?.keys as MennoBaleOrderKeys | undefined;
    const channelId = keys?.channelId?.trim();
    const botToken = (process.env.MENNO_BALE_ORDERS_BOT_TOKEN || '').trim();
    if (!party || !channelId || !botToken) return;

    const text = this.formatOrderMessage(order);
    const reply_markup = this.buildPanelOrderReplyMarkup(orderId);
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

  private formatOrderMessage(order: Order): string {
    const lines: string[] = [];

    const items = (order.items || []).filter((i) => !i.isAbstract);
    if (items.length) {
      lines.push('📋 اقلام:');
      for (const it of items) {
        const unit = it.quantity > 1 ? `${it.quantity} × ` : '';
        lines.push(`• ${unit}${it.title}`);
      }
    } else {
      lines.push('📋 اقلام: —');
    }

    lines.push('', `💰 جمع: ${PersianNumberService.withCommas(order.totalPrice)}`);

    const c = order.customer;
    lines.push('', '👤 مشتری:');
    if (c) {
      lines.push(User.fullName(c) || '—');
      lines.push(`📞 ${c.mobilePhone || order.details?.customerPhone || '—'}`);
    } else {
      lines.push('—');
      if (order.details?.customerPhone) lines.push(`📞 ${order.details.customerPhone}`);
    }

    lines.push('', '📍 آدرس:');
    const addr = order.address;
    if (addr) {
      const r = addr.region;
      if (r?.state) lines.push(`استان: ${r.state}`);
      if (r?.title) lines.push(`شهر/منطقه: ${r.title}`);
      const parts = [addr.description, addr.unit ? `واحد ${addr.unit}` : '', addr.ring ? `پلاک/زنگ ${addr.ring}` : '']
        .filter(Boolean)
        .join(' — ');
      if (parts) lines.push(parts);
      else lines.push('—');
    } else {
      switch (order.type) {
        case OrderType.DineIn:
          lines.push(order.details?.table ? `میز: ${order.details.table}` : 'حضوری در مجموعه');
          break;
        default:
          lines.push('—');
      }
    }

    if (order.note?.trim()) {
      lines.push('', `📝 ${order.note.trim()}`);
    }

    lines.push('', '──────────');
    if (order.deletedAt) {
      lines.push('🗑️ حذف از پنل');
    } else {
      lines.push(ORDER_STATE_LINE[order.state] ?? `❔ ${ORDER_STATE_FA[order.state] ?? String(order.state)}`);
    }

    return this.truncate(lines.join('\n'), 4090);
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

  private truncate(s: string, max: number): string {
    if (!s || s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
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
