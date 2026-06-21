import { EntitySchema } from 'typeorm';
import { PurchaseInvoice } from '@menno/types';

export const PurchaseInvoiceSchema = new EntitySchema<PurchaseInvoice>({
  name: 'PurchaseInvoice',
  target: PurchaseInvoice,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    date: { type: 'timestamptz' },
    supplier: { type: String, nullable: true },
    description: { type: String, nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    items: {
      type: 'one-to-many',
      target: 'PurchaseInvoiceItem',
      inverseSide: 'purchaseInvoice',
      cascade: true,
    },
  },
});
