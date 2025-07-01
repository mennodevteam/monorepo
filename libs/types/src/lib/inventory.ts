import { Product } from './product';
import { ProductVariant } from './product-variant';
import { Shop } from './shop';

export enum InventoryTransactionType {
  Purchase = 'purchase',
  Consumption = 'consumption',
  Adjustment = 'adjustment',
}

export enum MaterialUnit {
  Count = 'count',
  Gram = 'gram',
  Kg = 'kg',
  Liter = 'liter',
  Ml = 'ml',
}

export enum CostUpdateStrategy {
  Average = 'average',
  Last = 'last',
  Current = 'current',
}

export class Material {
  id: string;
  name: string;
  stock: number;
  unit: MaterialUnit;
  cost?: number;
  boms: BillOfMaterial[];
  shop: Shop;
  createdAt: Date;
}

export class InventoryTransaction {
  id: string;
  material: Material;
  type: InventoryTransactionType;
  quantity: number;
  unitPrice?: number;
  costUpdateStrategy?: CostUpdateStrategy;
  createdAt: Date;
  note?: string;
  shop: Shop;
}

export class BillOfMaterial {
  id: string;
  material: Material;
  product?: Product;
  variant?: ProductVariant;
  quantity: number;
}
