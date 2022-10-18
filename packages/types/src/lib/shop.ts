import { Region } from './region';
import { ShopGroup } from './shop-group';

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
  code: string;
  prevServerCode: string;
  username: string;
  lastDisconnectAlertAt: Date;
  region: Region;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  phones: string[];
  images: string[];
  deliveryAccountId?: string;
  smsAccountId?: string;
  bankPortalId?: string;
  menuId?: string;
  clubId?: string;
  logo: string;
  connectionAt: Date;
  shopGroup?: ShopGroup;
  options: any;
  details: ShopDetails;
  createdAt: Date;

  static isOpen(openingHours: string[][], time: Date): boolean {
    try {
      console.log(time);
      const dayOfWeek = (new Date(time).getDay() + 1) % 7;
      if (openingHours[dayOfWeek] && openingHours[dayOfWeek].length) {
        const now =
          new Date(time).getUTCHours() + new Date().getUTCMinutes() / 60;
        for (const time of openingHours[dayOfWeek]) {
          const fromTo = time.split('-');
          const from =
            Number(fromTo[0].split(':')[0]) +
            Number(fromTo[0].split(':')[1]) / 60;
          const to =
            Number(fromTo[1].split(':')[0]) +
            Number(fromTo[1].split(':')[1]) / 60;
          console.log('from', from, 'to', to, 'now:', now);
          if (from < to) {
            if (now >= from && now <= to) {
              return true;
            }
          } else {
            if (now >= from || now <= to) {
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      return true;
    }
  }
}
