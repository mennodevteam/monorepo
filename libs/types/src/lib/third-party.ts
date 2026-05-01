import { Shop } from './shop';

export enum ThirdPartyApp {
  Hami = 'hami',
  Alopeyk = 'alopeyk',
  Basalam = 'basalam',
  Clarity = 'clarity',
  Bale = 'bale',
}

export interface BaleBotStartConfig {
  message?: string;
  /** Public HTTPS URL of an image shown with the welcome (sendPhoto). */
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

export class ThirdParty {
  id: string;
  keys: BaleBotKeys | Record<string, unknown>;
  app: ThirdPartyApp;
  token?: string;
  shop: Shop;
}
