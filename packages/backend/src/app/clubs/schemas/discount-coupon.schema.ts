import { DiscountCoupon } from '@menno/types';
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
    isEnabled: {
      type: Boolean,
      default: true,
    },
    code: {
      type: String,
      nullable: true,
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
    member: {
      target: 'Member',
      type: 'many-to-one',
    },
  },
});
