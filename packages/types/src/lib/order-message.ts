import { Order } from './order';
import { OrderPaymentType } from './order-payment-type.enum';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Shop } from './shop';
import { SmsTemplate } from './sms-template';
import { Status } from './status.enum';

export enum OrderMessageEvent {
  OnAdd = 'onAdd',
  OnEdit = 'onEdit',
  OnChangeState = 'onChangeState',
  OnPayment = 'onPayment',
}

export class OrderMessage {
  id: number;
  shop: Shop;
  isManual?: boolean;
  state?: OrderState;
  type?: OrderType;
  payment?: OrderPaymentType;
  smsTemplate: SmsTemplate;
  status: Status;
  event: OrderMessageEvent;
  delayInMinutes: number;

  static find(messages: OrderMessage[], order: Order) {
    if (messages?.length) {
      const validMessages = messages.filter(
        (m) =>
          m.status === Status.Active &&
          m.smsTemplate?.isVerified &&
          (m.type == undefined || m.type == order.type) &&
          (m.state == undefined || m.state == order.state) &&
          (m.payment == undefined || m.payment == order.paymentType) &&
          (m.isManual == undefined || m.isManual == order.isManual)
      );

      if (validMessages.length === 1) return validMessages[0];

      const m = messages.find(
        (x) =>
          x.type != undefined && x.state != undefined && x.payment != undefined && x.isManual != undefined
      );
      if (m) return m;

      return validMessages[0];
    }
    return;
  }
}
