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
    disableOrdering: {
      type: Boolean,
      default: false,
    },
    disableOrderingText: {
      type: String,
      nullable: true,
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
    menuViewType: {
      type: 'enum',
      enum: MenuViewType,
      default: MenuViewType.Card,
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
