import { DiscountCoupon, OrderType, Status } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const DiscountCouponSchema = new EntitySchema<DiscountCoupon>({
  name: 'DiscountCoupon',
  target: DiscountCoupon,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
      nullable: true,
    },
    fixedDiscount: {
      type: Number,
      default: 0,
    },
    percentageDiscount: {
      type: Number,
      nullable: true,
    },
    minPrice: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      nullable: true,
    },
    maxUsePerUser: {
      type: Number,
      default: 1,
    },
    maxUse: {
      type: Number,
      nullable: true,
    },
    status: {
      type: 'simple-enum',
      enum: Status,
      default: Status.Active,
    },
    code: {
      type: String,
      nullable: true,
    },
    orderTypes: {
      type: 'simple-enum',
      enum: OrderType,
      array: true,
      default: [],
    },
    star: {
      type: Number,
      nullable: true,
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
    expiredAt: {
      type: 'timestamptz',
    },
    startedAt: {
      type: 'timestamptz',
      nullable: true,
    },
  },
  relations: {
    club: {
      type: 'many-to-one',
      target: 'Club',
    },
    user: {
      target: 'User',
      type: 'many-to-one',
      nullable: true,
    },
    tag: {
      target: 'MemberTag',
      type: 'many-to-one',
      nullable: true,
    },
  },
});
