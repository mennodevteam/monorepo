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
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
    },
    region: {
      type: 'many-to-one',
      target: 'Region',
    },
    deliveryArea: {
      type: 'many-to-one',
      target: 'DeliveryArea',
      nullable: true,
      onDelete: 'SET NULL'
    },
  },
});
