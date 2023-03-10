import { DeliveryArea, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const DeliveryAreaSchema = new EntitySchema<DeliveryArea>({
  name: 'DeliveryArea',
  target: DeliveryArea,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
    },
    price: {
      type: 'real',
    },
    minOrderPrice: {
      type: 'real',
      default: 0,
    },
    minPriceForFree: {
      type: 'real',
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    polygon: {
      type: 'simple-json',
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      inverseSide: 'deliveryAreas',
      target: 'Shop',
    },
  },
});
