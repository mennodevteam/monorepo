import { DeliveryArea } from './delivery-area';
import { Region } from './region';
import { User } from './user';

export class Address {
  id: number;
  title?: string;
  latitude: number;
  longitude: number;
  description: string;
  unit?: string;
  ring?: string;
  user: User;
  deliveryArea?: DeliveryArea | null;
  postalCode?: string;
  region?: Region;

  static haversine(address1: Address, address2: Address): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = ((address2.latitude || 0) - (address1.latitude || 0)) * (Math.PI / 180);
    const dLon = ((address2.longitude || 0) - (address1.longitude || 0)) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((address1.latitude || 0) * (Math.PI / 180)) *
        Math.cos((address2.latitude || 0) * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
