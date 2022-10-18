import { OrderConfig, OrderState } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const OrderConfigSchema = new EntitySchema<OrderConfig>({
  name: 'OrderConfig',
  target: OrderConfig,
  columns: {
    shopId: {
      type: 'uuid',
      primary: true,
    },
    customerMessageOnStateChange: {
      type: 'enum',
      enum: OrderState,
      array: true,
      default: [],
    },
    mobilePhonesOnNewOrder: {
      type: String,
      array: true,
      default: [],
    },
    qNumberStart: {
      type: Number,
      nullable: true,
    },
    autoSendLinkToCustomer: {
      type: Boolean,
      default: false,
    },
    dineInStates: {
      type: 'enum',
      enum: OrderState,
      array: true,
      default: [
        OrderState.Pending,
        OrderState.Processing,
        OrderState.Completed,
      ],
    },
    deliveryStates: {
      type: 'enum',
      enum: OrderState,
      array: true,
      default: [
        OrderState.Pending,
        OrderState.Processing,
        OrderState.Shipping,
        OrderState.Completed,
      ],
    },
    takeawayStates: {
      type: 'enum',
      enum: OrderState,
      array: true,
      default: [
        OrderState.Pending,
        OrderState.Processing,
        OrderState.Ready,
        OrderState.Completed,
      ],
    },
    customerMessageOnStateChangeConfig: {
      type: 'simple-json',
      default: {},
    },
  },
});
