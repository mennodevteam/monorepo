import { EntitySchema } from 'typeorm';
import { CostUpdateStrategy, InventoryTransaction, InventoryTransactionType } from '@menno/types';

export const InventoryTransactionSchema = new EntitySchema<InventoryTransaction>({
  name: 'InventoryTransaction',
  target: InventoryTransaction,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    type: { type: 'enum', enum: InventoryTransactionType },
    quantity: { type: 'real' },
    unitPrice: { type: Number, nullable: true },
    costUpdateStrategy: { type: 'enum', enum: CostUpdateStrategy, default: CostUpdateStrategy.Last },
    note: { type: String, nullable: true },
    createdAt: { type: 'timestamptz', createDate: true },
  },
  relations: {
    material: {
      type: 'many-to-one',
      target: 'Material',
      onDelete: 'CASCADE',
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
