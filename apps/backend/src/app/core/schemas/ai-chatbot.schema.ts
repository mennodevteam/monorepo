import { AiChatbot, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AiChatbotSchema = new EntitySchema<AiChatbot>({
  name: 'AiChatbot',
  target: AiChatbot,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    style: {
      type: String,
      nullable: true,
    },
    extraInfo: {
      type: String,
      nullable: true,
    },
    introMessage: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    smsAccount: {
      type: 'many-to-one',
      target: 'SmsAccount',
      inverseSide: 'aiChatbot',
    },
  },
});
