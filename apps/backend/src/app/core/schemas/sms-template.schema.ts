import { SmsTemplate } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const SmsTemplateSchema = new EntitySchema<SmsTemplate>({
  name: 'SmsTemplate',
  target: SmsTemplate,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
    },
    message: {
      type: String,
    },
    responseText: {
      type: String,
      nullable: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    creatorId: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    account: {
      type: 'many-to-one',
      target: 'SmsAccount',
      nullable: true,
    },
  },
});
