import { Address } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AddressSchema = new EntitySchema<Address>({
  name: 'Address',
  target: Address,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    latitude: {
      type: 'real',
      nullable: true,
    },
    longitude: {
      type: 'real',
      nullable: true,
    },
    userId: {
      type: String,
    },
  },
  relations: {
    region: {
      type: 'many-to-one',
      target: 'Region',
    },
    deliveryArea: {
      type: 'many-to-one',
      target: 'DeliveryArea',
      nullable: true,
    },
  },
});
