import { Shop } from './shop';

export class BasalamOAuth {
  id: number;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  vendorId: string;
  createdAt: Date;
  updatedAt: Date;
  shop: Shop;
}
