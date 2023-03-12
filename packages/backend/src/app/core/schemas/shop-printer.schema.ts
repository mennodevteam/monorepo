import { ShopPrinter } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopPrinterSchema = new EntitySchema<ShopPrinter>({
  name: 'ShopPrinter',
  target: ShopPrinter,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    name: {
      type: String,
    },
    deletedAt: {
      type: 'timestamptz',
      nullable: true,
      deleteDate: true,
    },
    config: {
      type: 'simple-json',
      default: {},
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
    printViews: {
      type: 'one-to-many',
      target: 'ShopPrintView',
      inverseSide: 'printer'
    }
  },
});
