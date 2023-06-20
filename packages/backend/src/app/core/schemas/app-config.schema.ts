import { AppConfig, MenuViewType, OrderType, ThemeMode } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AppConfigSchema = new EntitySchema<AppConfig>({
  name: 'AppConfig',
  target: AppConfig,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    themeMode: {
      type: 'enum',
      enum: ThemeMode,
      default: ThemeMode.Auto,
    },
    disablePayment: {
      type: Boolean,
      default: false,
    },
    disableOrdering: {
      type: Boolean,
      default: false,
    },
    ding: {
      type: Boolean,
      default: true,
    },
    dings: {
      type: String,
      array: true,
      nullable: true,
    },
    disableOrderingText: {
      type: String,
      nullable: true,
    },
    disableOrderingOnClose: {
      type: Boolean,
      default: false,
    },
    requiredPayment: {
      type: 'enum',
      array: true,
      enum: OrderType,
      default: [OrderType.Delivery],
    },
    requiredRegister: {
      type: 'enum',
      array: true,
      enum: OrderType,
      default: [OrderType.Delivery],
    },
    selectableOrderTypes: {
      type: 'enum',
      array: true,
      enum: OrderType,
      default: [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
    },
    orderingTypes: {
      type: 'enum',
      array: true,
      enum: OrderType,
      default: [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
    },
    menuViewType: {
      type: 'enum',
      enum: MenuViewType,
      default: MenuViewType.Manual,
    },
    menuCols: {
      type: Number,
      default: 2,
    },
  },
  relations: {
    theme: {
      type: 'many-to-one',
      target: 'Theme',
      nullable: true,
    },
  },
});
