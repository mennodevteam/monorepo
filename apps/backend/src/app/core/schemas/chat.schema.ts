import { Chat, ChatType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ChatSchema = new EntitySchema<Chat>({
  name: 'Chat',
  target: Chat,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    text: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    type: {
      type: 'enum',
      enum: ChatType,
    },
    createdAt: {
      createDate: true,
      type: 'timestamptz',
    },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      nullable: true,
    },
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
    user: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
    },
  },
});
