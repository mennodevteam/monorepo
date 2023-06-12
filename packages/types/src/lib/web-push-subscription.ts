import { Shop } from "./shop";
import { User } from "./user";

export class WebPushSubscription {
  id: string;
  shop?: Shop;
  user?: User;
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  createdAt: Date;
}
