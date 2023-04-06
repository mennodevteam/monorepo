import { DeliveryArea } from './delivery-area';
import { Region } from './region';
import { User } from './user';

export class Address {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  user: User;
  deliveryArea?: DeliveryArea | null;
  region: Region;
}
