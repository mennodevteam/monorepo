import { Member } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MemberSchema = new EntitySchema<Member>({
  name: 'Member',
  target: Member,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    gem: {
      type: Number,
      default: 0,
    },
    publicKey: {
      type: String,
      nullable: true,
    },
    joinedAt: {
      type: 'timestamptz',
      createDate: true,
    },
    description: {
      type: String,
      nullable: true,
    },
    star: {
      type: Number,
      default: 0,
    },
    extraInfo: {
      type: 'simple-json',
      default: {},
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      inverseSide: 'members',
      cascade: ['insert', 'update'],
    },
    club: {
      type: 'many-to-one',
      target: 'Club',
    },
    tags: {
      type: 'many-to-many',
      target: 'MemberTag',
      joinTable: true,
      cascade: ['insert'],
    },
    wallet: {
      type: 'one-to-one',
      target: 'Wallet',
      joinColumn: true,
    },
  },
  uniques: [
    {
      name: 'UNIQUE_USER_ID',
      columns: ['user', 'club'],
    },
    {
      name: 'UNIQUE_PUBLIC_KEY',
      columns: ['publicKey', 'club'],
    },
  ],
});
