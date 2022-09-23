import { DeliveryArea } from './delivery-area';
import { Region } from './region';

export class Address {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  userId: string;
  deliveryArea?: DeliveryArea;
  region: Region;
}
