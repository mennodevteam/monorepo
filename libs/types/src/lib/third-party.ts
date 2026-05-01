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
  primaryButtonText?: string;
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
