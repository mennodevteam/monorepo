import { PrintAction, PrintType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const PrintActionSchema = new EntitySchema<PrintAction>({
  name: 'PrintAction',
  target: PrintAction,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    type: {
      type: 'enum',
      enum: PrintType,
      default: PrintType.Cash,
    },
    data: {
      type: 'simple-json',
      default: {},
    },
    isPrinted: {
      type: Boolean,
      default: false,
    },
    waitForLocal: {
      type: Boolean,
      default: false,
    },
    printerName: {
      type: String,
    },
    printerTitle: {
      type: String,
      nullable: true,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    order: {
      type: 'many-to-one',
      target: 'Order',
      nullable: true,
    },
    printView: {
      type: 'many-to-one',
      target: 'ShopPrintView',
    },
  },
});
