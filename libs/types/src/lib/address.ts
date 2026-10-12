import { DeliveryArea } from './delivery-area';
import { Region } from './region';
import { User } from './user';

export class Address {
  id: number;
  title?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  unit?: string;
  ring?: string;
  user: User;
  deliveryArea?: DeliveryArea | null;
  postalCode?: string;
  region?: Region;

  static format(address?: Address | null): string {
    if (!address) return '';
    const parts: string[] = [];
    if (address.region) {
      const regionParts: string[] = [];
      if (address.region.state?.trim()) regionParts.push(address.region.state.trim());
      if (
        address.region.title?.trim() &&
        address.region.title.trim() !== address.region.state?.trim()
      ) {
        regionParts.push(address.region.title.trim());
      }
      if (regionParts.length) parts.push(regionParts.join('، '));
    }
    if (address.description?.trim()) {
      parts.push(address.description.trim());
    }
    if (address.unit?.trim()) {
      const val = address.unit.trim();
      parts.push(val.startsWith('پلاک') ? val : `پلاک ${val}`);
    }
    if (address.ring?.trim()) {
      const val = address.ring.trim();
      parts.push(val.startsWith('واحد') ? val : `واحد ${val}`);
    }
    if (address.postalCode?.trim()) {
      const val = address.postalCode.trim();
      parts.push(val.startsWith('کدپستی') ? val : `کدپستی: ${val}`);
    }
    return parts.join(' - ');
  }

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
