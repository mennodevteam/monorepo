import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaleBotKeys, Shop, ThirdPartyApp } from '@menno/types';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

interface BaleBotRuntime {
  shop: Shop;
  token: string;
  interval?: NodeJS.Timeout;
  offset: number;
  /** Prevents overlapping getUpdates polls (duplicate handling of the same update). */
  pollInFlight: boolean;
}

interface BaleMessage {
  text?: string;
}

interface BaleChat {
  id: number;
}

interface BaleUpdate {
  update_id: number;
  message?: BaleMessage & {
    chat: BaleChat;
  };
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

      this.startBotForShop(shop, baleParty.token);
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

    this.startBotForShop(shop, baleParty.token);
  }

  private startBotForShop(shop: Shop, token: string) {
    const runtime: BaleBotRuntime = {
      shop,
      token,
      offset: 0,
      pollInFlight: false,
    };
    this.runtimes.set(shop.id, runtime);

    runtime.interval = setInterval(() => {
      this.pollUpdates(shop.id).catch((error) => {
        this.logger.error(`Bale bot poll failed for shop ${shop.id}: ${error?.message || error}`);
      });
    }, 2000);
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
    this.runtimes.delete(shopId);
  }

  private async pollUpdates(shopId: string) {
    const runtime = this.runtimes.get(shopId);
    if (!runtime || runtime.pollInFlight) return;

    runtime.pollInFlight = true;
    try {
      const result = await this.callBotApi<{ result?: BaleUpdate[] }>(runtime.token, 'getUpdates', {
        timeout: 1,
        offset: runtime.offset,
      });

      const updates = result?.result ?? [];
      for (const update of updates) {
        runtime.offset = update.update_id + 1;
        await this.handleUpdate(runtime, update);
      }
    } finally {
      runtime.pollInFlight = false;
    }
  }

  private async handleUpdate(runtime: BaleBotRuntime, update: BaleUpdate) {
    const chatId = update.message?.chat?.id;
    if (!chatId || !update.message) return;

    await this.sendWelcomeMessage(runtime, chatId);
  }

  private async sendWelcomeMessage(runtime: BaleBotRuntime, chatId: number) {
    const appUrl = Shop.appLink(runtime.shop, process.env.APP_ORIGIN);
    const keys = runtime.shop.thirdParties?.find((item) => item.app === ThirdPartyApp.Bale)?.keys as BaleBotKeys;

    const baseMessage = keys?.start?.message || `برای شروع سفارش از لینک زیر استفاده کنید:\n${appUrl}`;
    const buttonText =
      keys?.start?.buttonText ||
      keys?.start?.primaryButtonText ||
      'ورود به سایت';

    const imageUrl = keys?.start?.imageUrl?.trim();
    const message =
      imageUrl && !baseMessage.includes(imageUrl) ? `${baseMessage}\n\n${imageUrl}`.trim() : baseMessage;

    const reply_markup = {
      inline_keyboard: [[{ text: buttonText, url: appUrl }]],
    };

    if (imageUrl) {
      await this.callBotApi(runtime.token, 'sendPhoto', {
        chat_id: chatId,
        photo: imageUrl,
        caption: message,
        reply_markup,
      });
    } else {
      await this.callBotApi(runtime.token, 'sendMessage', {
        chat_id: chatId,
        text: message,
        reply_markup,
      });
    }
  }

  private async callBotApi<T = unknown>(token: string, method: string, data: Record<string, unknown>) {
    const url = `${this.apiBaseUrl}/bot${token}/${method}`;
    const response = await firstValueFrom(this.http.post<T>(url, data));
    return response.data;
  }
}
