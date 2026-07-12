import { Campaign } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const CampaignSchema = new EntitySchema<Campaign>({
  name: 'Campaign',
  target: Campaign,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
    },
    startDate: {
      type: 'timestamptz',
    },
    endDate: {
      type: 'timestamptz',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    actions: {
      type: 'simple-json',
      default: [],
    },
    manualCosts: {
      type: 'simple-json',
      default: [],
    },
    showWelcomeDialog: {
      type: Boolean,
      default: false,
    },
    welcomeTitle: {
      type: String,
      nullable: true,
    },
    welcomeDescription: {
      type: String,
      nullable: true,
    },
    welcomeImageUrl: {
      type: String,
      nullable: true,
    },
    welcomeCtaText: {
      type: String,
      nullable: true,
    },
    welcomeCtaUrl: {
      type: String,
      nullable: true,
    },
    welcomeCtaLinkType: {
      type: String,
      nullable: true,
    },
    welcomeCtaLinkValue: {
      type: String,
      nullable: true,
    },
    showCountdown: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamptz',
      updateDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      nullable: true,
      deleteDate: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});
