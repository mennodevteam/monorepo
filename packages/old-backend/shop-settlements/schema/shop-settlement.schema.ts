import { ShopSettlement } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopSettlementSchema = new EntitySchema<ShopSettlement>({
  name: 'ShopSettlement',
  target: ShopSettlement,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    amount: {
      type: 'real',
    },
    fromDate: {
      type: 'timestamptz',
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    trackingCode: {
      type: String,
      nullable: true,
    },
    settlementedAt: {
      type: Date,
      nullable: true,
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    shopBankInfo: {
      type: 'many-to-one',
      target: 'ShopBankInfo',
    },
  },
});
