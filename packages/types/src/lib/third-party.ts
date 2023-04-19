import { Shop } from './shop';

export enum ThirdPartyApp {
  Hami = 'hami',
  Alopeyk = 'alopeyk',
}

export class ThirdParty {
  id: string;
  keys: any;
  app: ThirdPartyApp;
  token?: string;
  shop: Shop;
}
