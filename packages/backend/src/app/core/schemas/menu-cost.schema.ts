import { MenuCost, OrderType, Status } from '@menno/types';
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
    fromDate: {
      type: 'timestamptz',
      nullable: true,
    },
    toDate: {
      type: 'timestamptz',
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    description: {
      type: String,
      nullable: true,
    },
    percentageCost: {
      type: Number,
      default: 0,
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
    includeProductCategory: {
      type: 'many-to-many',
      target: 'ProductCategory',
      joinTable: true,
      nullable: true,
    },
    includeProduct: {
      type: 'many-to-many',
      target: 'Product',
      joinTable: true,
      nullable: true,
    },
  },
});
