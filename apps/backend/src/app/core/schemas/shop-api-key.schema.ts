import { ShopApiKey } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ShopApiKeySchema = new EntitySchema<ShopApiKey>({
  name: 'ShopApiKey',
  target: ShopApiKey,
  indices: [
    {
      name: 'idx_shop_api_key_hashed_key',
      columns: ['hashedKey'],
      unique: true,
    },
  ],
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    description: {
      type: String,
      nullable: true,
    },
    keyHint: {
      type: String,
    },
    hashedKey: {
      type: String,
    },
    scopes: {
      type: 'simple-json',
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    expiresAt: {
      type: 'timestamptz',
      nullable: true,
    },
    lastUsedAt: {
      type: 'timestamptz',
      nullable: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
      joinColumn: true,
      onDelete: 'CASCADE',
    },
  },
});
