import { Shop } from './shop';

export enum ThirdPartyApp {
  Hami = 'hami',
  Alopeyk = 'alopeyk',
  Basalam = 'basalam',
}

export class ThirdParty {
  id: string;
  keys: any;
  app: ThirdPartyApp;
  token?: string;
  shop: Shop;
}
