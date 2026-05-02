import { Shop } from './shop';

export enum ThirdPartyApp {
  Hami = 'hami',
  Alopeyk = 'alopeyk',
  Basalam = 'basalam',
  Clarity = 'clarity',
  Bale = 'bale',
  /** Menno: post/update order summaries in a Bale channel via Bot API (distinct from {@link ThirdPartyApp.Bale} shop welcome bot). */
  MennoBaleOrders = 'mennoBaleOrders',
}

export interface BaleBotStartConfig {
  message?: string;
  /** HTTPS URL of the original welcome image file (e.g. jpg/png from storage); used only as sendPhoto media, not in message text. */
  imageUrl?: string;
  /** Label for the single inline URL button (opens shop website). */
  buttonText?: string;
  /** @deprecated use buttonText */
  primaryButtonText?: string;
  /** @deprecated removed from UI; ignored if buttonText is set */
  secondaryButtonText?: string;
}

export interface BaleBotKeys {
  start?: BaleBotStartConfig;
}

/**
 * Keys for {@link ThirdPartyApp.MennoBaleOrders}.
 * Bot token and panel base URL come from server env; shops only store the channel id.
 */
export interface MennoBaleOrderKeys {
  /** Bale channel id (e.g. `-1001234567890`). Menno bot (env) must be admin in the channel. */
  channelId?: string;
}

export class ThirdParty {
  id: string;
  keys: BaleBotKeys | MennoBaleOrderKeys | Record<string, unknown>;
  app: ThirdPartyApp;
  token?: string;
  shop: Shop;
}
