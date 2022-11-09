import { DiscountUsage } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const DiscountUsageSchema = new EntitySchema<DiscountUsage>({
  name: 'DiscountUsage',
  target: DiscountUsage,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    member: {
      type: 'many-to-one',
      target: 'Member',
    },
    discountCoupon: {
      target: 'DiscountCoupon',
      type: 'many-to-one',
    },
  },
});
