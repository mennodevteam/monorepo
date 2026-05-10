import { AiChatMessage } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AiChatMessageSchema = new EntitySchema<AiChatMessage>({
  name: 'AiChatMessage',
  target: AiChatMessage,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    message: {
      type: String,
    },
    isFromUser: {
      type: Boolean,
      default: false,
    },
    promptTokens: {
      type: Number,
      nullable: true,
    },
    completionTokens: {
      type: Number,
      nullable: true,
    },
    totalTokens: {
      type: Number,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    aiChat: {
      type: 'many-to-one',
      target: 'AiChat',
      inverseSide: 'messages',
    },
  },
});
