import { AppConfig } from './app-config';
import { Club } from './club';
import { Menu } from './menu';
import { Region } from './region';
import { ShopGroup } from './shop-group';
import { ShopUser } from './shop-user';
import { SmsAccount } from './sms-account';

export interface ShopTable {
  code: string;
  title?: string;
}

export interface ShopDetails {
  tables?: ShopTable[];
  poses?: string[];
  instagram?: string;
  description?: string;
  diagonInviteCode?: string;
  openingHours?: string[][];
}

export class Shop {
  id: string;
  title: string;
  description: string;
  code: string;
  prevServerCode: string;
  username: string;
  lastDisconnectAlertAt: Date;
  region: Region;
  domain: string;
  latitude: number;
  longitude: number;
  address: string;
  instagram: string;
  phones: string[];
  images: string[];
  deliveryAccountId?: string;
  smsAccount?: SmsAccount;
  bankPortalId?: string;
  menu?: Menu;
  club?: Club;
  logo: string;
  appConfig?: AppConfig;
  connectionAt: Date;
  shopGroup?: ShopGroup;
  options: any;
  users: ShopUser[];
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

  static isUsernameValid(username: string): boolean {
    const regex = /^[a-zA-Z0-9_]{3,}$/.test(username);
    return regex;
}
}
