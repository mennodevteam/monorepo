import { Shop } from './shop';

export class ShopApiKey {
  id: string;
  description: string;
  keyHint: string;
  hashedKey: string;
  scopes: string[];
  shop: Shop;
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
}
