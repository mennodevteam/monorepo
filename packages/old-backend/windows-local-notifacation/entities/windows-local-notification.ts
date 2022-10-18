import { Shop } from 'src/shops/entities/shop';

export class WindowsLocalNotification {
  id: number;
  title: string;
  description: string;
  shop: Shop;
  failedCount: number;
  isNotified: boolean;
  photoName: string;
  createdAt: Date;
}
