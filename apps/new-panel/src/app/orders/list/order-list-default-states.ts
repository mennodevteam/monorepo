import { OrderState } from '@menno/types';

export const ORDER_LIST_DEFAULT_STATES: OrderState[] = [
  OrderState.Pending,
  OrderState.Processing,
  OrderState.Ready,
  OrderState.Shipping,
  OrderState.Completed,
];
