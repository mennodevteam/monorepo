import { Shop } from './shop';
import { Status } from './status.enum';

export class ShopBankInfo {
  id: number;
  IBAN: number;
  firstName: string;
  lastName: string;
  details: any;
  status: Status;
  shop: Shop;
}
