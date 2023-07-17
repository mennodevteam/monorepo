import {
  Member,
  NewSmsDto,
  Order,
  OrderMessage,
  OrderMessageEvent,
  OrderPaymentType,
  Shop,
  ShopPrintView,
  SmsTemplate,
  Status,
  User,
} from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';
import { WebPushNotificationsService } from '../web-push-notifications/web-push-notifications.service';
import { SmsService } from '../sms/sms.service';
import { PrintersService } from '../printers/printers.service';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(OrderMessage)
    private orderMessagesRepo: Repository<OrderMessage>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(ShopPrintView)
    private shopPrintViewsRepo: Repository<ShopPrintView>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private webPush: WebPushNotificationsService,
    private printersService: PrintersService,
    private smsService: SmsService
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>) {
    const order = event.entity;

    const shop = order.shop
      ? await this.shopsRepo.findOne({ where: { id: order.shop.id }, relations: ['club', 'smsAccount'] })
      : undefined;

    const customer = order.customer ? await this.usersRepo.findOneBy({ id: order.customer.id }) : undefined;

    if (customer && shop && shop.club) {
      const member = await this.membersRepo.findOne({
        where: {
          club: { id: shop.club.id },
          user: { id: customer.id },
        },
        withDeleted: true,
      });

      if (!member) {
        this.membersRepo.save({
          club: { id: shop.club.id },
          user: { id: customer.id },
        });
      }
    }

    if (!order.isManual) {
      this.webPush.notifToShop(order.shop.id, {
        title: 'سفارش جدید',
        options: {
          body: `فیش شماره ${order.qNumber}`,
          data: { newOrder: order },
        },
      });
    }
    if (customer?.mobilePhone && shop.smsAccount && shop.smsAccount.charge > 0) {
      this.orderMessagesRepo
        .find({
          where: {
            shop: { id: shop.id },
            event: OrderMessageEvent.OnAdd,
            smsTemplate: { isVerified: true },
            status: Status.Active,
          },
          relations: ['smsTemplate'],
        })
        .then((messages) => {
          if (messages.length) {
            const message = OrderMessage.find(messages, order, OrderMessageEvent.OnAdd);
            if (message) {
              const dto = new NewSmsDto();
              dto.receptors = [customer.mobilePhone];
              dto.accountId = shop.smsAccount.id;
              dto.templateId = message.smsTemplate.id;
              dto.templateParams = SmsTemplate.getTemplateParams([customer], shop, process.env.APP_ORIGIN);
              dto.templateParams['###'] = [
                Order.getLink(order.id, shop, process.env.APP_ORIGIN, process.env.APP_ORDER_PAGE_PATH),
              ];
              if (message.delayInMinutes) {
                dto.sentAt = new Date();
                dto.sentAt.setMinutes(dto.sentAt.getMinutes() + message.delayInMinutes);
              }
              this.smsService.sendTemplate(dto).catch((err) => {});
            }
          }
        });
    }

    try {
      this.autoPrint(order, shop, true);
    } catch (error) {}
  }

  async afterUpdate(event: UpdateEvent<Order>): Promise<any> {
    try {
      const order = {
        ...(await this.ordersRepo.findOne({ where: { id: event.entity.id }, relations: ['shop'] })),
        ...event.entity,
      };
      this.autoPrint(order as Order, order.shop, false);
    } catch (error) {}
  }

  private async autoPrint(order: Order, shop: Shop, isAdded?: boolean) {
    const printerViews = await this.shopPrintViewsRepo.findBy({ printer: { shop: { id: shop.id } } });

    for (const p of printerViews) {
      if (!isAdded && order.paymentType === OrderPaymentType.Online && p.autoPrintOnOnlinePayment) {
        this.printersService.printOrder({
          orderId: order.id,
          prints: [{ printViewId: p.id }],
          waitForLocal: false,
        });
      }

      if (
        !isAdded &&
        order.paymentType !== OrderPaymentType.NotPayed &&
        order.paymentType !== OrderPaymentType.Online &&
        p.autoPrintOnManualSettlement
      ) {
        {
          this.printersService.printOrder({
            orderId: order.id,
            prints: [{ printViewId: p.id }],
            waitForLocal: false,
          });
        }
      }

      if (isAdded && !order.isManual && p.autoPrintOnNewOrder) {
        this.printersService.printOrder({
          orderId: order.id,
          prints: [{ printViewId: p.id }],
          waitForLocal: false,
        });
      }
    }
  }
}
