export class WebPushSubscription {
  id: string;
  businessId: string;
  userId: string;
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  createdAt: Date;
}
