import { forwardRef, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { PrintActionsService } from 'src/shop-printers/print-actions.service';
import { PrintViewsService } from 'src/shop-printers/print-views.service';
import { WindowsLocalNotification } from 'src/windows-local-notifacation/entities/windows-local-notification';
import { WindowsLocalNotificationService } from 'src/windows-local-notifacation/windows-local-notification.service';
import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';
import {
  ClubMicroservice,
  NotificationMicroservice,
  SmsMicroservice,
  StockMicroservice,
  UserMicroservice,
} from '../core/microservices';
import { FilterMemberDto } from '../core/models/filter-member.dto';
import { Member } from '../core/models/member';
import { Purchase } from '../core/models/purchase';
import { PushNotification } from '../core/models/push-notification';
import { QuantityLogDto } from '../core/models/quantity-log-dto';
import { User } from '../core/models/user';
import { WebPushSubscription } from '../core/models/web-push-subscription';
import { MenusService } from '../menus/menus.service';
import { ShopsService } from '../shops/shops.service';
import { Order } from './entities/order';
import { OrderState } from './entities/order-state.enum';
import { OrderType } from './entities/order-type.enum';
import { OrderConfigsService } from './order-configs.service';
import { OrdersService } from './orders.service';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    connection: Connection,
    private shopsService: ShopsService,
    private ordersService: OrdersService,
    private configsService: OrderConfigsService,
    private menuService: MenusService,
    private printerViewsService: PrintViewsService,
    private printerActionService: PrintActionsService,
    private windowsLocalNotificationService: WindowsLocalNotificationService,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @Inject(ClubMicroservice.name) private clubMicroservice: ClientProxy,
    @Inject(NotificationMicroservice.name)
    private notificationMicroservice: ClientProxy,
    @Inject(SmsMicroservice.name) private smsMicroservice: ClientProxy,
    @Inject(UserMicroservice.name) private userMicroservice: ClientProxy,
    @Inject(StockMicroservice.name) private stockMicroservice: ClientProxy
  ) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>) {
    const order = event.entity;
    order.id = event.manager.getId(event.entity);
    order.shop = await this.shopsService.findOne(order.shop.id);
    if (!event.entity.isManual && !event.entity.mergeFrom) {
      try {
        this.sendNewOrderToShopAdmin(order);
      } catch (error) {}

      try {
        this.sendNewOrderNotificationToShop(order);
      } catch (error) {}

      try {
        this.autoPrint(order, true);
      } catch (error) {}
      try {
        this.insertWindowsNotification(order);
      } catch (error) {
        console.log(error);
      }
    }

    try {
      this.setStockQuantity(order);
    } catch (error) {}

    if (event.entity.isPayed) {
      try {
        this.addPurchase(event.entity);
      } catch (error) {}
    }

    if (event.entity.isManual) {
      const config = await this.configsService.findOne(order.shop.id);
      if (config && config.autoSendLinkToCustomer) {
        this.ordersService.sendOrderLinkToCustomer(event.entity.id);
      }
    }

    if (event.entity.customerId && order.shop.clubId) {
      this.clubMicroservice
        .send<[Member[], number]>('members/filter', <FilterMemberDto>{
          clubId: order.shop.clubId,
          userId: event.entity.customerId,
        })
        .subscribe(async (members) => {
          let member: Member;

          if (members[1] === 1) {
            member = members[0][0];
          }

          if (!member) {
            member = <Member>{
              club: { id: order.shop.clubId },
              userId: event.entity.customerId,
            };
            this.clubMicroservice.send('members/save', member).toPromise();
          }
        });
    }
  }

  async afterUpdate(event: UpdateEvent<Order>) {
    if (event.entity) {
      const dbOrder = await this.ordersService.findOne(event.entity.id);
      const order = event.entity;
      for (const key in dbOrder) {
        if (!event.updatedColumns.find((x) => x.propertyName === key))
          order[key] = dbOrder[key];
      }
      if (event.updatedColumns.find((x) => x.propertyName === 'state')) {
        // check status of order changed
        const config = await this.configsService.findOne(order.shop.id);
        if (
          config &&
          config.customerMessageOnStateChangeConfig &&
          config.customerMessageOnStateChangeConfig.length
        ) {
          this.sendOrderStateChangeToCustomerByOrderType(order);
        } else {
          this.sendOrderStateChangeToCustomer(order);
        }
      }
      if (
        event.updatedColumns.find(
          (x) => x.propertyName === 'isPayed' || x.propertyName === 'customerId'
        ) &&
        order.isPayed == true
      ) {
        this.addPurchase(order);
      }
      if (
        event.updatedColumns.find((x) => x.propertyName === 'isPayed') &&
        order.isPayed == true
      ) {
        this.autoPrint(order, false);
      }
      if (
        event.updatedColumns.find((x) => x.propertyName === 'customerId') &&
        order.isManual
      ) {
        const config = await this.configsService.findOne(order.shop.id);
        if (config && config.autoSendLinkToCustomer) {
          this.ordersService.sendOrderLinkToCustomer(undefined, order);
        }
      }
    }
  }

  private async addPurchase(order: Order) {
    try {
      if (order.customerId && order.shop.clubId) {
        const members = await this.clubMicroservice
          .send<[Member[], number]>('members/filter', <FilterMemberDto>{
            clubId: order.shop.clubId,
            userId: order.customerId,
          })
          .toPromise();

        let member: Member;
        if (members[1] === 1) {
          member = members[0][0];
        }

        if (member) {
          this.clubMicroservice
            .send('purchases/save', <Purchase>{
              items: order.items
                .filter((x) => x.product)
                .map((x) => x.product.id),
              labels: [OrderType[order.type]],
              price: order.totalPrice,
              member: { id: member.id },
              discountCoupon: order.details.discountCouponId
                ? { id: order.details.discountCouponId }
                : undefined,
            })
            .toPromise();
        }
      }
    } catch (error) {}
  }

  async setStockQuantity(order: Order) {
    for (const item of order.items) {
      if (item.product && item.product.limitQuantity) {
        this.stockMicroservice
          .send('stockItems/setChanges', <QuantityLogDto>{
            businessId: order.shop.id,
            change: -1 * item.quantity,
            description: 'add order',
            itemId: item.product.id,
            userId: order.customerId,
          })
          .toPromise();
      }
    }
  }

  async sendNewOrderNotificationToShop(order: Order) {
    this.notificationMicroservice
      .send('subscriptions/findByBusinessId', order.shop.id)
      .subscribe((subs: WebPushSubscription[]) => {
        const notifs: PushNotification[] = [];
        let type: string;
        switch (order.type) {
          case OrderType.DineIn:
            if (order.details.table) type = `میز ${order.details.table}`;
            else type = `داخل مجموعه`;
            break;
          case OrderType.Delivery:
            type = `ارسال با پیک`;
            break;
          case OrderType.Takeaway:
            type = `تحویل در مجموعه`;
            break;
        }
        const items: string = order.items
          .filter((x) => !x.isAbstract)
          .map((x) => (x.quantity > 1 ? x.title + `(${x.quantity})` : x.title))
          .join(' - ');

        for (const sub of subs) {
          notifs.push(<PushNotification>{
            title: `سفارش جدید ${type}`,
            options: {
              badge: process.env.LOGO_URL,
              dir: 'rtl',
              body: items,
              data: order,
            },
            to: { id: sub.id },
          });
        }
        this.notificationMicroservice
          .send('notifications/send', notifs)
          .toPromise();
      });
  }

  async sendNewOrderToShopAdmin(order: Order) {
    const config = await this.configsService.findOne(order.shop.id);
    if (config) {
      if (
        order.shop.smsAccountId &&
        config.mobilePhonesOnNewOrder &&
        process.env.NEW_ORDER_KAVENEGAR_TEMPLATE
      ) {
        for (const mobile of config.mobilePhonesOnNewOrder) {
          if (order.packOrderId) {
            const customer = await this.userMicroservice
              .send<User>('users/findOne', order.customerId)
              .toPromise();
            const tokens = [order.qNumber.toString()];
            tokens[3] = order.items.find((x) => !x.isAbstract).title;
            tokens[4] = User.fullName(customer);

            this.smsMicroservice
              .send('sms/lookup', {
                mobilePhone: mobile,
                kavenagarTemplate:
                  process.env.NEW_DIAGON_ORDER_KAVENEGAR_TEMPLATE,
                tokens,
              })
              .toPromise();
          } else {
            this.smsMicroservice
              .send('sms/lookup', {
                accountId: order.shop.smsAccountId,
                mobilePhone: mobile,
                kavenagarTemplate: process.env.NEW_ORDER_KAVENEGAR_TEMPLATE,
                tokens: [order.qNumber],
              })
              .toPromise();
          }
        }
      }
    }
  }

  async sendOrderStateChangeToCustomer(order: Order) {
    const config = await this.configsService.findOne(order.shop.id);
    if (
      order.customer &&
      config.customerMessageOnStateChange &&
      config.customerMessageOnStateChange.indexOf(order.state) > -1
    ) {
      let template: string;
      let timeout = 1;
      switch (order.state) {
        case OrderState.Processing:
          template = process.env.ORDER_PROCESSING_STATE_KAVENEGAR_TEMPLATE;
          break;
        case OrderState.Shipping:
          template = process.env.ORDER_SHIPPING_STATE_KAVENEGAR_TEMPLATE;
          break;
        case OrderState.Ready:
          template = process.env.ORDER_READY_STATE_KAVENEGAR_TEMPLATE;
          break;
        case OrderState.Completed:
          template = process.env.ORDER_COMPLETED_STATE_KAVENEGAR_TEMPLATE;
          timeout = 60000;
          break;
        case OrderState.Canceled:
          template = process.env.ORDER_CANCELED_STATE_KAVENEGAR_TEMPLATE;
          break;
        default:
          break;
      }
      if (template) {
        const tokens: string[] = [];
        tokens[0] = order.id;
        tokens[3] = User.fullName(order.customer);
        tokens[4] = order.shop.title;
        setTimeout(() => {
          this.smsMicroservice
            .send('sms/lookup', {
              accountId: order.shop.smsAccountId,
              mobilePhone: order.customer.mobilePhone,
              kavenagarTemplate: template,
              tokens,
            })
            .toPromise();
        }, timeout);
      }
    }
  }

  async sendOrderStateChangeToCustomerByOrderType(order: Order) {
    const config = await this.configsService.findOne(order.shop.id);
    if (
      order.customer &&
      config.customerMessageOnStateChangeConfig &&
      config.customerMessageOnStateChangeConfig.length
    ) {
      let hasStateInTypeOrder = config.customerMessageOnStateChangeConfig.find(
        (x) =>
          x.orderType == order.type && x.orderStates.indexOf(order.state) > -1
      );
      let template: string;
      let timeout = 1;
      if (hasStateInTypeOrder) {
        switch (order.state) {
          case OrderState.Processing:
            template = process.env.ORDER_PROCESSING_STATE_KAVENEGAR_TEMPLATE;
            break;
          case OrderState.Shipping:
            template = process.env.ORDER_SHIPPING_STATE_KAVENEGAR_TEMPLATE;
            break;
          case OrderState.Ready:
            template = process.env.ORDER_READY_STATE_KAVENEGAR_TEMPLATE;
            break;
          case OrderState.Completed:
            template = process.env.ORDER_COMPLETED_STATE_KAVENEGAR_TEMPLATE;
            timeout = 60000;
            break;
          case OrderState.Canceled:
            template = process.env.ORDER_CANCELED_STATE_KAVENEGAR_TEMPLATE;
            break;
          default:
            break;
        }
        if (template) {
          const tokens: string[] = [];
          tokens[0] = order.id;
          tokens[3] = User.fullName(order.customer);
          tokens[4] = order.shop.title;
          setTimeout(() => {
            this.smsMicroservice
              .send('sms/lookup', {
                accountId: order.shop.smsAccountId,
                mobilePhone: order.customer.mobilePhone,
                kavenagarTemplate: template,
                tokens,
              })
              .toPromise();
          }, timeout);
        }
      }
    }
  }

  private async autoPrint(order: Order, isAdded?: boolean) {
    const printerViews = await this.printerViewsService.findByShopId(
      order.shop.id
    );

    for (const p of printerViews) {
      if (
        !isAdded &&
        order.details.paymentType == 'online' &&
        p.autoPrintOnOnlinePayment &&
        order.isPayed
      ) {
        this.printerActionService.printOrder({
          orderId: order.id,
          prints: [{ printViewId: p.id }],
          waitForLocal: false,
        });
      }

      if (
        !isAdded &&
        order.isPayed &&
        order.details.paymentType !== 'online' &&
        p.autoPrintOnManualSettlement
      ) {
        {
          this.printerActionService.printOrder({
            orderId: order.id,
            prints: [{ printViewId: p.id }],
            waitForLocal: false,
          });
        }
      }

      if (isAdded && !order.isManual && p.autoPrintOnNewOrder) {
        this.printerActionService.printOrder({
          orderId: order.id,
          prints: [{ printViewId: p.id }],
          waitForLocal: false,
        });
      }
    }
  }

  private async insertWindowsNotification(order: Order) {
    let notification = new WindowsLocalNotification();
    notification.shop = order.shop;
    notification.isNotified = false;
    notification.failedCount = 0;
    notification.title = 'سفارش جدید';
    switch (order.type) {
      case OrderType.DineIn:
        if (order.details.table)
          notification.description = `${order.details.table}  میز  `;
        else {
          notification.description = 'داخل مجموعه';
        }
        break;

      case OrderType.Delivery:
        notification.description = 'ارسال با پیک';
        break;
      case OrderType.Takeaway:
        notification.description = 'بیرون بر';
        break;
    }

    this.windowsLocalNotificationService.save(notification);
  }
}
