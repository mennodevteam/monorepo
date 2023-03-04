import { Payment } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const PaymentSchema = new EntitySchema<Payment>({
  name: 'Payment',
  target: Payment,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
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
    invoiceId: {
      type: String,
    },
    shopId: {
      type: String,
      nullable: true,
    },
    isCompleted: {
      type: Boolean,
    },
    referenceId: {
      type: String,
      unique: true,
    },
    message: {
      type: String,
      nullable: true,
    },
    token: {
      type: String,
    },
    appReturnUrl: {
      type: String,
      nullable: true,
    },
    confirmedAt: {
      type: 'timestamptz',
      nullable: true,
    },
    reversedAt: {
      type: 'timestamptz',
      nullable: true,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    details: {
      type: 'simple-json',
      default: {},
    },
  },
  relations: {
    gateway: {
      type: 'many-to-one',
      target: 'PaymentGateway',
    },
  },
});
