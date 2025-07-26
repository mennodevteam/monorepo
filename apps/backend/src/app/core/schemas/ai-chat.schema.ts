import { AiChat } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AiChatSchema = new EntitySchema<AiChat>({
  name: 'AiChat',
  target: AiChat,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
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
      inverseSide: 'aiChats',
    },
    aiChatbot: {
      type: 'many-to-one',
      target: 'AiChatbot',
      inverseSide: 'aiChats',
    },
    user: {
      type: 'many-to-one',
      target: 'User',
      inverseSide: 'aiChats',
    },
    messages: {
      type: 'one-to-many',
      target: 'AiChatMessage',
      inverseSide: 'aiChat',
    },
  },
});
