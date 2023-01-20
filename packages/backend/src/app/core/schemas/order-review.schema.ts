import { OrderReview } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderReviewSchema = new EntitySchema<OrderReview>({
  name: 'OrderReview',
  target: OrderReview,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    rate: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      nullable: true,
    },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      inverseSide: 'reviews',
    },
    user: {
      type: 'many-to-one',
      target: 'User',
    },
  },
});
