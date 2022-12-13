import { MenuCost, OrderType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MenuCostSchema = new EntitySchema<MenuCost>({
  name: 'MenuCost',
  target: MenuCost,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
      nullable: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    percentageCost: {
      type: Number,
      default: 0,
    },
    includeProductCategoryIds: {
      type: Number,
      nullable: true,
      array: true,
    },
    includeProductIds: {
      type: String,
      nullable: true,
      array: true,
    },
    fixedCost: {
      type: 'real',
      default: 0,
    },
    showOnItem: {
      type: Boolean,
      default: false,
    },
    orderTypes: {
      type: 'enum',
      array: true,
      enum: OrderType,
      default: [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
    },
  },
  relations: {
    menu: {
      type: 'many-to-one',
      target: 'Menu',
    },
  },
});
