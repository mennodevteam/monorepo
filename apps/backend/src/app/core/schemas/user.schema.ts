import { EntitySchema } from 'typeorm';
import { GenderType, User, UserRole } from '@menno/types';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    username: {
      type: String,
      unique: true,
      nullable: true,
    },
    password: {
      type: String,
      nullable: true,
    },
    mobilePhone: {
      type: String,
      unique: true,
      nullable: true,
    },
    email: {
      type: String,
      unique: true,
      nullable: true,
    },
    firstName: {
      type: String,
      nullable: true,
    },
    lastName: {
      type: String,
      nullable: true,
    },
    birthDate: {
      type: 'timestamptz',
      nullable: true,
    },
    marriageDate: {
      type: 'timestamptz',
      nullable: true,
    },
    job: {
      type: String,
      nullable: true,
    },
    role: {
      type: 'simple-enum',
      enum: UserRole,
      nullable: true,
    },
    extraInfo: {
      type: 'simple-json',
      default: {},
    },
    avatar: {
      type: String,
      nullable: true,
    },
    instagram: {
      type: String,
      nullable: true,
    },
    localPhone: {
      type: String,
      nullable: true,
    },
    address: {
      type: String,
      nullable: true,
    },
    gender: {
      type: 'enum',
      enum: GenderType,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    members: {
      type: 'one-to-many',
      target: 'Member',
      inverseSide: 'user',
    },
  },
});
