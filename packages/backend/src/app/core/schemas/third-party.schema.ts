import { ThirdParty, ThirdPartyApp } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ThirdPartySchema = new EntitySchema<ThirdParty>({
  name: 'ThirdParty',
  target: ThirdParty,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    app: {
      type: 'simple-enum',
      enum: ThirdPartyApp,
    },
    keys: {
      type: 'simple-json',
      default: {},
    },
    token: {
      type: String,
      nullable: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
