import { Purchase } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const PurchaseSchema = new EntitySchema<Purchase>({
  name: 'Purchase',
  target: Purchase,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    items: {
      type: String,
      array: true,
      default: [],
    },
    labels: {
      type: String,
      array: true,
      default: [],
    },
    price: {
      type: 'real',
    },
    gem: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    member: {
      type: 'many-to-one',
      target: 'Member',
    },
  },
});
