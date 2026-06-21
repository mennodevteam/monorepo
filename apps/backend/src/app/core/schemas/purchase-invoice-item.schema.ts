import { EntitySchema } from 'typeorm';
import { PurchaseInvoiceItem, CostUpdateStrategy } from '@menno/types';

export const PurchaseInvoiceItemSchema = new EntitySchema<PurchaseInvoiceItem>({
  name: 'PurchaseInvoiceItem',
  target: PurchaseInvoiceItem,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    quantity: { type: 'real' },
    unitPrice: { type: Number },
    costUpdateStrategy: { type: 'enum', enum: CostUpdateStrategy, default: CostUpdateStrategy.Last },
    previousStock: { type: 'real', nullable: true },
    previousCost: { type: Number, nullable: true },
  },
  relations: {
    purchaseInvoice: {
      type: 'many-to-one',
      target: 'PurchaseInvoice',
      onDelete: 'CASCADE',
    },
    material: {
      type: 'many-to-one',
      target: 'Material',
      onDelete: 'CASCADE',
    },
  },
});
