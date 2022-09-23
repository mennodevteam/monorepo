import { Region } from './region';

export interface ShopTable {
  code: string;
  title?: string;
}

export interface ShopDetails {
  tables?: ShopTable[];
  poses?: string[];
  instagram?: string;
  description?: string;
  openingHours?: string[][];
  diagonInviteCode?: string;
}

export class Shop {
  id: string;
  title: string;
  prevServerCode: string;
  code: string;
  username: string;
  region: Region;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  phones: string[];
  images: string[];
  smsAccountId?: string;
  bankPortalId?: string;
  deliveryAccountId?: string;
  menuId?: string;
  clubId?: string;
  dings?: string[];
  logo: string;
  options: any;
  details: ShopDetails;
  createdAt: Date;
}
