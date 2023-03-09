import { PrintType, ShopPrintView } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopPrintViewSchema = new EntitySchema<ShopPrintView>({
  name: 'ShopPrintView',
  target: ShopPrintView,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    type: {
      type: 'enum',
      enum: PrintType,
      default: PrintType.Cash,
    },
    defaultCount: {
      type: Number,
      default: 1,
    },
    includeProductCategoryIds: {
      type: Number,
      array: true,
      nullable: true,
    },
    title: {
      type: String,
    },
    deletedAt: {
      type: 'timestamptz',
      nullable: true,
      deleteDate: true,
    },
    autoPrintOnManualSettlement: {
      type: Boolean,
      default: false,
    },
    autoPrintOnNewOrder: {
      type: Boolean,
      default: false,
    },
    autoPrintOnOnlinePayment: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    printer: {
      type: 'many-to-one',
      target: 'ShopPrinter',
      cascade: ['insert'],
    },
  },
});
