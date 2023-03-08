import { PaymentGateway, PaymentGatewayType } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const PaymentGatewaySchema = new EntitySchema<PaymentGateway>({
  name: 'PaymentGateway',
  target: PaymentGateway,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    type: {
      type: 'simple-enum',
      enum: PaymentGatewayType,
      default: PaymentGatewayType.Sizpay,
    },
    title: {
      type: String,
      nullable: true,
    },
    keys: {
      type: 'simple-json',
      nullable: true,
      select: false,
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
  },
});
