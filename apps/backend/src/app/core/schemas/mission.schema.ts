import { Mission, MissionConditionPeriod, MissionRewardType, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MissionSchema = new EntitySchema<Mission>({
  name: 'Mission',
  target: Mission,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: Status,
      default: Status.Active,
    },
    description: {
      type: String,
      nullable: true,
    },
    conditionPeriod: {
      type: 'enum',
      enum: MissionConditionPeriod,
    },
    orderSum: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    rewardType: {
      type: 'enum',
      enum: MissionRewardType,
    },
    rewardValue: {
      type: Number,
      default: 0,
    },
    durationInDays: {
      type: Number,
      nullable: true,
    },
    rewardDetails: {
      type: 'simple-json',
      nullable: true,
    },
    startedAt: {
      type: 'timestamptz',
      nullable: true,
    },
    expiredAt: {
      type: 'timestamptz',
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    club: {
      type: 'many-to-one',
      target: 'Club',
    },
  },
});
