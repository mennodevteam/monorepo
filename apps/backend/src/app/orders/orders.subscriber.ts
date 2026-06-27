import {
  InventoryTransaction,
  BillOfMaterial,
  Material,
  Member,
  NewSmsDto,
  Order,
  OrderItem,
  OrderMessage,
  OrderMessageEvent,
  OrderPaymentType,
  OrderType,
  Shop,
  ShopPrintView,
  SmsTemplate,
  Status,
  User,
  WindowsLocalNotification,
  InventoryTransactionType,
  BillOfProduct,
  Product,
} from '@menno/types';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  IsNull,
  Not,
  QueryRunner,
  Repository,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { WebPushNotificationsService } from '../web-push-notifications/web-push-notifications.service';
import { SmsService } from '../sms/sms.service';
import { PrintersService } from '../printers/printers.service';
import * as Sentry from '@sentry/node';
import { RedisKey, RedisService } from '../core/redis.service';
import { PersianNumberService } from '@menno/utils';
import { MennoBaleOrderNotificationsService } from '../third-parties/menno-bale-order-notifications.service';

@EventSubscriber()
export class OrdersSubscriber implements EntitySubscriberInterface<Order> {
  private readonly logger = new Logger(OrdersSubscriber.name);

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
    @InjectRepository(WindowsLocalNotification)
    private windowsLocalNotificationRepo: Repository<WindowsLocalNotification>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(InventoryTransaction)
    private inventoryTransactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(BillOfMaterial)
    private billOfMaterialRepository: Repository<BillOfMaterial>,
    @InjectRepository(BillOfProduct)
    private billOfProductRepository: Repository<BillOfProduct>,
    private webPush: WebPushNotificationsService,
    private printersService: PrintersService,
    private smsService: SmsService,
    private redis: RedisService,
    private mennoBaleOrderNotifications: MennoBaleOrderNotificationsService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  /**
   * After INSERT, TypeORM may leave `entity.id` unset while still passing the generated PK in {@link InsertEvent.entityId}
   * (single-column PKs become a plain string). Without this, Web Push / Menno Bale skip `order.id`.
   */
  /** Fire-and-forget after DB commit — does not block order save */
  private syncMennoBaleInBackground(
    orderId: string,
    allowCreate: boolean,
    queryRunner: QueryRunner | undefined,
    items?: OrderItem[],
  ): void {
    this.mennoBaleOrderNotifications.scheduleSyncAfterCommit(orderId, allowCreate, queryRunner, items);
  }

  private pickInsertPrimaryKey(event: InsertEvent<Order>): string | undefined {
    const raw = event.entityId;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && 'id' in raw && typeof (raw as { id: unknown }).id === 'string') {
      return (raw as { id: string }).id;
    }
    return undefined;
  }

  async beforeInsert(event: InsertEvent<Order>) {
    const order = event.entity;

    if (!order.emojiKey) {
      const emojis = [
        // Fruits & Vegetables
        '🍎', '🍌', '🍇', '🍉', '🍒', '🍍', '🥕', '🍋',
        // Foods
        '🍕', '🍔', '🍟', '🍩', '🍦', '🍳',
        // Animals
        '🦁', '🐱', '🐶', '🦊', '🐸', '🐙', '🐠', '🦀', '🐼', '🐵', '🐧', '🦋', '🐝', '🦉',
        // Vehicles
        '🚗', '🏍️', '🚲', '✈️', '🚀', '🛸', '⛵',
        // Objects
        '🔑', '🔔', '🎁', '🎈', '⚽', '🎮', '🎨', '🕶️',
        // Nature & Symbols
        '🌞', '🌈', '⭐', '🔥', '💧', '❤️', '🟢', '🔵', '🔴', '🟡', '⬛',
        // Flags
        '🇮🇷'
      ];
      const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
      order.emojiKey = randomEmoji();
    }

    if (!order.trackingCode) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const randomDigits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
      order.trackingCode = `${randomLetter}${randomDigits}`;
    }

    const customer = order.customer ? await this.usersRepo.findOneBy({ id: order.customer.id }) : undefined;
    const shop = order.shop
      ? await this.shopsRepo.findOne({ where: { id: order.shop.id }, relations: ['club'] })
      : undefined;

    if (customer && shop && shop.club) {
      const member = await this.membersRepo.findOne({
        where: {
          club: { id: shop.club.id },
          user: { id: customer.id },
        },
        withDeleted: true,
      });

      if (!member) {
        // Pass the loaded `User` entity, not `{ id }` only. Member.user has cascade update;
        // a bare id reference can make TypeORM emit an empty User UPDATE (UpdateValuesMissingError).
        await this.membersRepo.save({
          club: { id: shop.club.id },
          user: customer,
        } as Member);
      }
    }
  }

  async afterInsert(event: InsertEvent<Order>) {
    const order = event.entity;
    const resolvedId = order.id || this.pickInsertPrimaryKey(event);
    if (resolvedId && !order.id) {
      Object.assign(order, { id: resolvedId });
    }

    const shop = order.shop
      ? await this.shopsRepo.findOne({ where: { id: order.shop.id }, relations: ['club', 'smsAccount'] })
      : undefined;

    this.redis.updateMenu(shop.id);

    const customer = order.customer ? await this.usersRepo.findOneBy({ id: order.customer.id }) : undefined;
    if (customer) order.customer = customer;

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

    try {
      this.insertWindowsNotification(order, shop);
    } catch (error) {}

    try {
      this.appConfigSmsNewOrder(order, shop);
    } catch (error) {}

    try {
      this.materialConsumption(order, false);
    } catch (error) {}

    if (resolvedId) {
      this.logger.debug(`Menno Bale afterInsert order=${resolvedId} qNumber=${order.qNumber} shop=${order.shop?.id}`);
      this.syncMennoBaleInBackground(resolvedId, true, event.queryRunner, order.items);
    } else {
      this.logger.log(
        `[Menno Bale] afterInsert skip: no order id (entity.id=${order.id ?? 'unset'} entityId=${JSON.stringify(event.entityId)})`,
      );
    }
  }

  async afterUpdate(event: UpdateEvent<Order>): Promise<any> {
    try {
      const updated = event.updatedColumns?.map((c) => c.propertyName as string) ?? [];
      const mennoOnly =
        updated.length > 0 &&
        updated.every((c) => c === 'mennoBaleChannelMessageId' || c === 'mennoBaleNotifyChannelId');
      const orderId = event.entity?.id as string | undefined;
      if (orderId && !mennoOnly) {
        this.logger.debug(
          `Menno Bale afterUpdate order=${orderId} allowCreate=false updated=[${updated.join(',')}]`,
        );
        const entityItems = event.entity?.items;
        this.syncMennoBaleInBackground(
          orderId,
          false,
          event.queryRunner,
          Array.isArray(entityItems) && entityItems.length > 0 ? entityItems : undefined,
        );
      } else if (orderId && mennoOnly) {
        this.logger.debug(`Menno Bale afterUpdate skip order=${orderId}: mennoBale fields only`);
      }

      const order = {
        ...(await this.ordersRepo.findOne({ where: { id: event.entity.id }, relations: ['shop'] })),
        ...event.entity,
      };

      this.redis.updateMenu(order.shop.id);

      this.autoPrint(order as Order, order.shop, false);
    } catch (error) {}
  }

  async afterSoftRemove(event: SoftRemoveEvent<Order>): Promise<any> {
    if (event.entity?.id) {
      this.logger.debug(`Menno Bale afterSoftRemove order=${event.entity.id} allowCreate=false`);
      this.syncMennoBaleInBackground(event.entity.id, false, event.queryRunner);

      const order = await this.ordersRepo.findOne({
        where: { id: event.entity.id },
        relations: ['items', 'items.product', 'items.productVariant', 'shop'],
        withDeleted: true,
      });
      if (order) this.materialConsumption(order, true);
    }
  }

  private async materialConsumption(order: Order, isRestore?: boolean) {
    const items = order.items.filter((x) => !x.isAbstract);
    const boms = await this.billOfMaterialRepository.find({
      where: {
        material: { shop: { id: order.shop.id } },
      },
      relations: ['material', 'product', 'variant'],
    });
    const bops = await this.billOfProductRepository.find({
      where: {
        shop: { id: order.shop.id },
      },
      relations: ['productSource', 'variantSource', 'product', 'variant'],
    });

    const usedMaterials: { material: Material; quantity: number }[] = [];
    for (const item of items) {
      const materials = Product.getAllMaterials(item.product, item.productVariant, boms, bops);
      for (const material of materials) {
        const existingMaterial = usedMaterials.find((x) => x.material.id === material.material.id);
        if (existingMaterial) {
          existingMaterial.quantity += material.quantity * item.quantity;
        } else {
          usedMaterials.push({ material: material.material, quantity: material.quantity * item.quantity });
        }
      }
    }

    for (const material of usedMaterials) {
      if (material.material.stock > 0 || isRestore) {
        await this.materialRepository.update(material.material.id, {
          stock: () => `stock ${isRestore ? '+' : '-'} ${material.quantity}`,
        });
        await this.inventoryTransactionRepository.save({
          material: { id: material.material.id },
          quantity: isRestore ? -material.quantity : material.quantity,
          type: InventoryTransactionType.Consumption,
        });
      }
    }
  }

  private async appConfigSmsNewOrder(order: Order, shop: Shop) {
    if (!order.isManual && !order.mergeFrom?.length && shop.smsAccount && shop.smsAccount.charge > 0) {
      const shopWithConfig = await this.shopsRepo.findOne({
        where: { id: shop.id },
        relations: ['appConfig'],
      });
      if (shopWithConfig?.appConfig?.smsOnNewOrder?.length) {
        let message = `سفارش جدید: `;
        switch (order.type) {
          case OrderType.DineIn:
            if (order.details.table) message += `${order.details.table}  میز  `;
            else {
              message += 'داخل مجموعه';
            }
            break;

          case OrderType.Delivery:
            message += 'ارسال با پیک';
            break;
          case OrderType.Takeaway:
            message += 'بیرون بر';
            break;
        }

        message += `\n\n فیش شماره ${order.qNumber}\n${order.items
          .filter((x) => !x.isAbstract)
          .map((x) => `${x.title} ${x.quantity} عدد`)
          .join('\n')}\n\n جمع‌کل: ${PersianNumberService.withCommas(order.totalPrice)} تومان`;

        if (order.customer) message += `\n\n${User.fullName(order.customer)}\n${order.customer.mobilePhone}`;

        void this.smsService
          .send({
            accountId: shop.smsAccount.id,
            messages: shopWithConfig.appConfig.smsOnNewOrder.map((x) => message),
            receptors: shopWithConfig.appConfig.smsOnNewOrder,
          })
          .catch(() => undefined);
      }
    }
  }

  private async insertWindowsNotification(order: Order, shop: Shop) {
    if (order.isManual) return;
    const notification = new WindowsLocalNotification();
    notification.id = Date.now();
    notification.shop = shop;
    notification.isNotified = false;
    notification.failedCount = 0;
    notification.title = 'سفارش جدید';
    notification.createdAt = new Date();
    switch (order.type) {
      case OrderType.DineIn:
        if (order.details.table) notification.description = `${order.details.table}  میز  `;
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
    const redisKey = this.redis.key(RedisKey.WindowsLocalNotification, shop.id);
    this.redis.client.lpush(redisKey, JSON.stringify(notification));
  }

  private async autoPrint(order: Order, shop: Shop, isAdded?: boolean) {
    const printerViews = await this.shopPrintViewsRepo.findBy({ printer: { shop: { id: shop.id } } });
    Sentry.captureEvent({
      level: 'debug',
      tags: {
        printViews: printerViews.length,
      },
      message: 'panel auto pring',
      transaction: order.id,
      user: {
        id: shop.id,
      },
      extra: { printViews: printerViews.map((p) => p.id).join(','), isAdded },
    });
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
