import { ShopBankInfo, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopBankInfoSchema = new EntitySchema<ShopBankInfo>({
  name: 'ShopBankInfo',
  target: ShopBankInfo,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    IBAN: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    details: {
      type: 'simple-json',
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
  },
  relations: {
    shop: {
      type: 'one-to-one',
      target: 'Shop',
      joinColumn: true,
    },
  },
  uniques: [
    {
      name: 'UNIQUE_SHOP_ID',
      columns: ['shop'],
    },
  ],
});
