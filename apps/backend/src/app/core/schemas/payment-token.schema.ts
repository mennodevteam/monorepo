import { PaymentToken } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const PaymentTokenSchema = new EntitySchema<PaymentToken>({
  name: 'PaymentToken',
  target: PaymentToken,
  columns: {
    id: {
      type: String,
      primary: true,
    },
    amount: {
      type: Number,
    },
    userId: {
      type: String,
      nullable: true,
    },
    userPhone: {
      type: String,
      nullable: true,
    },
    appReturnUrl: {
      type: String,
      nullable: true,
    },
    invoiceId: {
      type: String,
      nullable: true,
    },
    shopId: {
      type: String,
      nullable: true,
    },
    orderId: {
      type: String,
      nullable: true,
    },
    returnUrl: {
      type: String,
      nullable: true,
    },
    extraInfo: {
      type: 'simple-json',
      default: {},
    },
    details: {
      type: 'simple-json',
      default: {},
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
  relations: {
    gateway: {
      type: 'many-to-one',
      target: 'PaymentGateway',
    },
  },
});
