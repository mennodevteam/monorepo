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

export class Material {
  id: string;
  name: string;
  stock: number;
  unit: MaterialUnit;
  averageCost?: number;
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
