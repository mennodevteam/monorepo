import { BasalamOAuth } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const BasalamOAuthSchema = new EntitySchema<BasalamOAuth>({
  name: 'BasalamOAuth',
  target: BasalamOAuth,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    vendorId: {
      type: String,
      nullable: true,
    },
    accessToken: {
      type: String,
      nullable: true,
    },
    expiresIn: {
      type: Number,
      nullable: true,
    },
    refreshToken: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamptz',
      updateDate: true,
    },
  },
  relations: {
    shop: {
      type: 'one-to-one',
      target: 'Shop',
      joinColumn: true,
    },
  },
});
