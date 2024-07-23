import { AppConfig } from './app-config';
import { Club } from './club';
import { DeliveryArea } from './delivery-area';
import { Image } from './image';
import { Menu } from './menu';
import { PaymentGateway } from './payment-gateway';
import { Region } from './region';
import { ShopGroup } from './shop-group';
import { ShopPlugins } from './shop-plugin';
import { ShopUser } from './shop-user';
import { SmsAccount } from './sms-account';
import { Status } from './status.enum';
import { ThirdParty } from './third-party';

export enum BusinessCategory {
  Cafe = 'CAFE',
  Restaurant = 'RESTAURANT',
  Protein = 'PROTEIN',
  Confectionary = 'CONFECTIONARY',
  GameCafe = 'GAME_CAFE',
  JuiceAndIceCream = 'JUICE_AND_ICE_CREAM',
  Herbal = 'HERBAL',
  Nuts = 'NUTS',
  Fruits = 'FRUITS',
  Other = 'OTHER',
}

export interface ShopTable {
  code: string;
  title?: string;
}

export interface ShopDetails {
  tables?: ShopTable[];
  poses?: string[];
  openingHours?: string[][];
  enamad?: {
    id: string;
    code: string;
  };
  enamadInnerHtml?: string;
}

export class Shop {
  id: string;
  title: string;
  description: string;
  code: string;
  prevServerCode: string;
  prevServerUsername: string;
  username: string;
  lastDisconnectAlertAt: Date;
  region: Region;
  domain: string;
  latitude: number;
  longitude: number;
  address: string;
  instagram: string;
  businessCategory?: BusinessCategory;
  phones: string[];
  images: string[];
  deliveryAreas?: DeliveryArea[];
  smsAccount?: SmsAccount;
  paymentGateway?: PaymentGateway;
  status: Status;
  menu?: Menu;
  club?: Club;
  logo: string;
  logoImage: Image;
  cover: string;
  coverImage: Image;
  verticalCover: string;
  verticalCoverImage: Image;
  appConfig?: AppConfig;
  connectionAt: Date;
  shopGroup?: ShopGroup;
  options: any;
  plugins?: ShopPlugins;
  thirdParties?: ThirdParty[];
  users: ShopUser[];
  details: ShopDetails;
  createdAt: Date;

  static isOpen(openingHours: string[][], time = new Date()): boolean {
    try {
      const dayOfWeek = (new Date(time).getDay() + 1) % 7;
      if (openingHours[dayOfWeek] && openingHours[dayOfWeek].length) {
        const now = new Date(time).getHours() + new Date().getMinutes() / 60;
        for (const time of openingHours[dayOfWeek]) {
          const fromTo = time.split('-');
          const from = Number(fromTo[0].split(':')[0]) + Number(fromTo[0].split(':')[1]) / 60;
          const to = Number(fromTo[1].split(':')[0]) + Number(fromTo[1].split(':')[1]) / 60;
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

  static appLink(shop: Shop, origin: string) {
    return shop.domain ? `https://${shop.domain}` : `https://${shop.username}.${origin}`;
  }

  static isPaymentAvailable(shop: Shop) {
    return shop.paymentGateway && !shop.appConfig?.disablePayment;
  }
}
