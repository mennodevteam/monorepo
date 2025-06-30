import { EntitySchema } from 'typeorm';
import { InventoryTransaction, InventoryTransactionType } from '@menno/types';

export const InventoryTransactionSchema = new EntitySchema<InventoryTransaction>({
  name: 'InventoryTransaction',
  target: InventoryTransaction,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    type: { type: 'enum', enum: InventoryTransactionType },
    quantity: { type: Number },
    unitPrice: { type: Number, nullable: true },
    date: { type: Date },
    note: { type: String, nullable: true },
  },
  relations: {
    material: {
      type: 'many-to-one',
      target: 'Material',
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
