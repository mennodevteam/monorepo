import {
  FilterOrderDto,
  ManualSettlementDto,
  MANUAL_COST_TITLE,
  MANUAL_DISCOUNT_TITLE,
  Member,
  Menu,
  Order,
  OrderDto,
  OrderItem,
  OrderPaymentType,
  OrderReportDto,
  Product,
  ProductCategory,
  Shop,
  User,
  DiscountCoupon,
  OrderState,
  OrderMessageEvent,
  Status,
  OrderMessage,
  NewSmsDto,
  SmsTemplate,
  WalletLog,
  ProductVariant,
  WalletLogType,
  Wallet,
} from '@menno/types';
import { groupBy, groupBySum } from '@menno/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindManyOptions,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { WalletsService } from '../clubs/wallets.service';
import { AuthPayload } from '../core/types/auth-payload';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Wallet)
    private walletsRepo: Repository<Wallet>,
    @InjectRepository(DiscountCoupon)
    private discountCouponsRepo: Repository<DiscountCoupon>,
    @InjectRepository(OrderMessage)
    private orderMessagesRepo: Repository<OrderMessage>,
    private smsService: SmsService,
    private walletsService: WalletsService,
  ) {}

  async dtoToOrder(dto: OrderDto) {
    const order = new Order();
    const shop = await this.shopsRepo.findOne({
      where: { id: dto.shopId },
      relations: [
        'menu.categories.products.variants',
        'menu.costs.includeProductCategory',
        'menu.costs.includeProduct',
      ],
    });

    if (!shop) throw new HttpException('shop not found', HttpStatus.NOT_ACCEPTABLE);

    order.shop = <Shop>{ id: dto.shopId };
    order.customer = dto.customerId ? ({ id: dto.customerId } as User) : null;

    if (dto.creatorId) order.creator = { id: dto.creatorId } as User;
    if (dto.waiterId) order.waiter = { id: dto.waiterId } as User;
    if (dto.details) order.details = dto.details;
    if (dto.id) order.id = dto.id;
    if (dto.isManual) order.isManual = dto.isManual;
    if (dto.note) order.note = dto.note;
    if (dto.address) order.address = dto.address;
    if (dto.payment) order.payment = dto.payment;
    if (dto.paymentType != undefined) order.paymentType = dto.paymentType;
    if (dto.state != undefined) order.state = dto.state;
    if (dto.type != undefined) order.type = dto.type;
    if (dto.discountCoupon) {
      dto.discountCoupon = order.discountCoupon = await this.discountCouponsRepo.findOneBy({
        id: dto.discountCoupon.id,
      });
    }

    const menu = shop.menu;
    Menu.setRefsAndSort(menu, dto.type, true, true, undefined, dto.isManual ? true : false);
    order.items = [...OrderDto.productItems(dto, menu), ...OrderDto.abstractItems(dto, menu)];

    for (const item of order.items) {
      if (item.product) item.product = { id: item.product.id } as Product;
      if (item.productVariant) item.productVariant = { id: item.productVariant.id } as ProductVariant;
    }

    if (dto.useWallet) {
      const member: Member = await this.membersRepo.findOne({
        where: { user: { id: order.customer.id }, club: { id: order.shop.club.id } },
        relations: ['wallet'],
      });
      if (member?.wallet?.charge) {
        order.useWallet = Math.min(member.wallet.charge, order.totalPrice);
      }
    }

    order.totalPrice = OrderDto.total(dto, menu);
    return order;
  }

  async addOrder(dto: OrderDto) {
    const order = await this.dtoToOrder(dto);

    const lastOrder = await this.ordersRepo.findOne({
      where: {
        shop: { id: dto.shopId },
        qNumber: Not(IsNull()),
      },
      order: {
        createdAt: 'DESC',
      },
      withDeleted: true,
    });

    if (lastOrder) {
      const orderDate = new Date(lastOrder.createdAt);
      orderDate.setHours(orderDate.getHours() - 2);

      const now = new Date();
      now.setHours(now.getHours() - 2);

      if (orderDate.toDateString() === now.toDateString()) order.qNumber = Number(lastOrder.qNumber) + 1;
      else order.qNumber = 1;
    } else order.qNumber = 1;

    if (order.useWallet) {
      const member: Member = await this.membersRepo.findOne({
        where: { user: { id: order.customer.id }, club: { id: order.shop.club.id } },
        relations: ['wallet'],
      });
      if (member?.wallet?.charge >= order.useWallet) {
        await this.walletsService.updateWalletAmount(
          {
            wallet: { id: member.wallet.id },
            amount: -order.useWallet,
            user: { id: order.customer.id },
            type: WalletLogType.PayOrder,
          } as WalletLog,
          order.shop.id,
        );
      }
    }

    return await this.ordersRepo.save(order);
  }

  async report(dto: OrderReportDto) {
    const condition: FindOptionsWhere<Order> = {};
    condition.mergeTo = IsNull();

    condition.shop = { id: dto.shopId };
    const shop = await this.shopsRepo.findOneBy({ id: dto.shopId });

    if (dto.fromDate && dto.toDate) {
      condition.createdAt = Between(dto.fromDate, dto.toDate);
    } else if (dto.fromDate) {
      condition.createdAt = MoreThanOrEqual(dto.fromDate);
    } else if (dto.toDate) {
      condition.createdAt = LessThanOrEqual(dto.toDate);
    }

    if (dto.waiterId) {
      condition.waiter = { id: dto.waiterId };
    }

    if (dto.customerId) {
      condition.customer = { id: dto.customerId };
    }

    if (dto.states) condition.state = In(dto.states);
    if (dto.types) condition.type = In(dto.types);
    if (dto.payments) condition.paymentType = In(dto.payments);

    const relations = [];
    switch (dto.groupBy) {
      case 'product':
        relations.push('items.product');
        break;
      case 'category':
        relations.push('items.product.category');
        break;
      default:
        relations.push('items');
    }

    const orders = await this.ordersRepo.find({
      where: condition,
      order: {
        createdAt: 'ASC',
      },
      relations: relations,
    });

    const orderItems = orders.reduce((items: OrderItem[], order: Order) => {
      return [...items, ...order.items];
    }, []);

    let data: ReturnType<typeof groupBySum> = {};
    const dateDefaultKeys = {};
    if (dto.groupBy === 'date') {
      const date = new Date(dto.fromDate);
      while (date.toDateString() != new Date(dto.toDate).toDateString()) {
        dateDefaultKeys[date.toDateString()] = { sum: 0, count: 0 };
        date.setDate(date.getDate() + 1);
      }
    }

    switch (dto.groupBy) {
      case 'date':
        data = groupBySum<Order>(
          orders,
          (order) => {
            const date = new Date(order.createdAt);
            if (Shop.isRestaurantOrCoffeeShop(shop.businessCategory)) {
              date.setHours(date.getHours() - 3);
            }
            return date.toDateString();
          },
          (order) => order.totalPrice,
          (order) => 1,
          dateDefaultKeys,
        );
        break;
      case 'payment':
        data = {};
        orders.forEach((o) => {
          if (o.paymentType === OrderPaymentType.Cash) {
            if (o.details?.posPayed?.length) {
              let sum = 0;
              for (let i = 0; i < o.details.posPayed.length; i++) {
                const value = o.details.posPayed[i];
                if (value > 0) {
                  sum += value;

                  const pos = shop?.details?.poses[i] || `POS_${i}`;
                  if (data[pos]) {
                    data[pos].sum += value;
                    data[pos].count++;
                  } else data[pos] = { sum: value, count: 1 };
                }
              }
              if (sum < o.totalPrice) {
                const pos = 'نقد';
                const value = o.totalPrice - sum;
                if (data[pos]) {
                  data[pos].sum += value;
                  data[pos].count++;
                } else data[pos] = { sum: value, count: 1 };
              }
            }
          } else if (o.paymentType === OrderPaymentType.ClubWallet) {
            if (data['اعتباری']) {
              data['اعتباری'].sum += o.totalPrice;
              data['اعتباری'].count++;
            } else data['اعتباری'] = { sum: o.totalPrice, count: 1 };
          } else if (o.paymentType === OrderPaymentType.Online) {
            if (data['آنلاین']) {
              data['آنلاین'].sum += o.totalPrice;
              data['آنلاین'].count++;
            } else data['آنلاین'] = { sum: o.totalPrice, count: 1 };
          }
        });
        break;
      case 'state':
        data = groupBySum<Order>(
          orders,
          (order) => order.state.toString(),
          (order) => order.totalPrice,
          (order) => 1,
        );
        break;
      case 'type':
        data = groupBySum<Order>(
          orders,
          (order) => order.type.toString(),
          (order) => order.totalPrice,
          (order) => 1,
        );
        break;
      case 'category':
        data = groupBySum<OrderItem>(
          orderItems.filter((x) => x.product?.category),
          (item) => item.product.category.id.toString(),
          (item) => item.price * item.quantity,
          (item) => item.quantity,
        );
        break;
      case 'product':
        orderItems.sort((a, b) => (a.isAbstract && !b.isAbstract ? 1 : -1));
        data = groupBySum<OrderItem>(
          orderItems,
          (item) => item.title,
          (item) => item.quantity * item.price,
          (item) => item.quantity,
        );
        break;
    }

    return data;
  }

  async editOrder(dto: OrderDto) {
    const order = await this.ordersRepo.findOne({
      where: { id: dto.id },
      relations: ['items.product', 'items.productVariant', 'customer', 'shop'],
    });
    if (order.shop.id !== dto.shopId) {
      throw new HttpException('this order is for another shop', HttpStatus.FORBIDDEN);
    }
    if (order.paymentType) throw new HttpException('not allowed for payed orders', HttpStatus.NOT_ACCEPTABLE);

    if (order.customer && !!order.paymentType) {
      delete dto.customerId;
    }

    if (order.waiter) {
      delete dto.waiterId;
    }

    const editedOrder = await this.dtoToOrder(dto);
    editedOrder.id = dto.id;

    // set prev details
    editedOrder.details = { ...(order.details || {}), ...(editedOrder.details || {}) };

    // create changes value
    if (!editedOrder.details.itemChanges) editedOrder.details.itemChanges = [];
    const changes: {
      title: string;
      change: number;
    }[] = [];

    for (const item of order.items) {
      if (item.isAbstract || !item.product) continue;
      const dtoItem = dto.productItems.find(
        (x) => x.productId == item.product.id && x.productVariantId == item.productVariant?.id,
      );
      if (!dtoItem) changes.push({ title: item.title, change: -1 * item.quantity });
      else if (dtoItem.quantity != item.quantity)
        changes.push({ title: item.title, change: dtoItem.quantity - item.quantity });
    }

    const newProductItems = editedOrder.items.filter(
      (x) =>
        x.product &&
        !order.items.find(
          (y) => y.product && y.product.id === x.product.id && y.productVariant?.id === x.productVariant?.id,
        ),
    );
    for (const item of newProductItems) {
      changes.push({ title: item.title, change: item.quantity });
    }
    if (changes.length) editedOrder.details.itemChanges.push(changes);

    this.checkAfterUpdateOrderMessage(dto.id, OrderMessageEvent.OnEdit);

    delete editedOrder.qNumber;
    delete editedOrder.creator;
    delete editedOrder.shop;
    delete editedOrder.state;
    delete editedOrder.payment;
    delete editedOrder.isManual;
    delete editedOrder.mergeTo;
    delete editedOrder.mergeFrom;
    delete editedOrder.reviews;
    await this.orderItemsRepo.remove(order.items);
    return this.ordersRepo.save(editedOrder);
  }

  async filter(dto: FilterOrderDto) {
    const condition: FindOptionsWhere<Order> = {
      mergeTo: null,
    };

    if (dto.fromDate && dto.toDate) {
      condition.createdAt = Between(dto.fromDate, dto.toDate);
    } else if (dto.fromDate) {
      condition.createdAt = MoreThanOrEqual(dto.fromDate);
    } else if (dto.toDate) {
      condition.createdAt = LessThanOrEqual(dto.toDate);
    }

    if (dto.updatedAt) {
      condition.updatedAt = MoreThan(dto.updatedAt);
    }

    if (dto.shopId) condition.shop = { id: dto.shopId };
    if (dto.states?.length) condition.state = In(dto.states);
    if (dto.types?.length) condition.type = In(dto.types);
    if (dto.paymentTypes?.length) condition.paymentType = In(dto.paymentTypes);

    if (dto.customerId === null) {
      condition.customer = IsNull();
    } else if (dto.customerId) {
      condition.customer = { id: dto.customerId };
    }

    if (dto.creatorId === null) {
      condition.creator = IsNull();
    } else if (dto.creatorId) {
      condition.creator = { id: dto.creatorId };
    }
    if (dto.waiterId === null) {
      condition.waiter = IsNull();
    } else if (dto.waiterId) {
      condition.waiter = { id: dto.waiterId };
    }
    if (dto.isManual === true || dto.isManual === false) condition.isManual = dto.isManual;

    const relations = [
      'items',
      'mergeTo',
      'mergeFrom',
      'reviews',
      'customer',
      'creator',
      'waiter',
      'address.deliveryArea',
    ];

    const params: FindManyOptions<Order> = {
      where: condition,
      order: { createdAt: 'DESC' },
      relations,
      select: {
        mergeFrom: {
          id: true,
        },
      },
      skip: dto.skip,
      take: dto.take,
      withDeleted: dto.withDeleted,
    };

    const orders = dto.withCount
      ? await this.ordersRepo.findAndCount(params)
      : await this.ordersRepo.find(params);

    return orders;
  }

  async manualSettlement(dto: ManualSettlementDto, user: AuthPayload): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: dto.orderId },
      relations: ['shop.club', 'items.product', 'items.productVariant', 'customer'],
    });
    if (order && order.items.length > 0) {
      const perviousManualCost = order.items.find((x) => x.title === MANUAL_COST_TITLE && x.isAbstract);
      if (perviousManualCost) {
        order.totalPrice -= perviousManualCost.price;
        const index = order.items.findIndex((x) => x.id === perviousManualCost.id);
        order.items.splice(index, 1);
      }

      const perviousManualDiscount = order.items.find(
        (x) => x.title === MANUAL_DISCOUNT_TITLE && x.isAbstract,
      );
      if (perviousManualDiscount) {
        order.totalPrice += Math.abs(perviousManualDiscount.price);
        const index = order.items.findIndex((x) => x.id === perviousManualDiscount.id);
        order.items.splice(index, 1);
      }
    }

    if (dto.manualDiscount) {
      order.totalPrice = order.totalPrice - Math.abs(dto.manualDiscount);
      order.items.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.abs(dto.manualDiscount) * -1,
        title: MANUAL_DISCOUNT_TITLE,
      });
    }

    if (dto.manualCost) {
      order.totalPrice = order.totalPrice + Math.abs(dto.manualCost);
      order.items.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.abs(dto.manualCost),
        title: MANUAL_COST_TITLE,
      });
    }

    if (dto.type === OrderPaymentType.ClubWallet) {
      const member: Member = await this.membersRepo.findOne({
        where: { user: { id: order.customer.id }, club: { id: order.shop.club.id } },
        relations: ['wallet'],
      });
      if (!member.wallet) {
        member.wallet = await this.walletsRepo.save({ charge: 0, member: { id: member.id } });
      }
      await this.walletsService.updateWalletAmount(
        {
          wallet: { id: member.wallet.id },
          amount: -order.totalPrice,
          user: { id: user.id },
          type: WalletLogType.PayOrder,
        } as WalletLog,
        order.shop.id,
      );
    }

    this.checkAfterUpdateOrderMessage(dto.orderId, OrderMessageEvent.OnPayment);

    return this.ordersRepo.save({
      id: order.id,
      paymentType: dto.type,
      items: order.items,
      totalPrice: order.totalPrice,
      details: { ...order.details, posPayed: dto.posPayed },
    });
  }

  async setCustomer(orderId: string, memberId: string) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['customer'] });
    if (order?.customer?.mobilePhone) throw new HttpException('order has customer', HttpStatus.CONFLICT);
    const member = await this.membersRepo.findOne({ where: { id: memberId }, relations: ['user'] });
    if (order && member)
      await this.ordersRepo.update(order.id, {
        customer: { id: member.user.id },
      });
    order.customer = member.user;
    return order;
  }

  async remove(orderId: string, shopId: string, description?: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, shop: { id: shopId } },
      relations: ['items'],
    });
    if (order) {
      if (description) order.details = { ...order.details, deletionReason: description };
      await this.ordersRepo.update(orderId, {
        state: OrderState.Canceled,
        details: order.details,
      });
      await this.ordersRepo.softDelete(orderId);
      for (const item of order.items) {
        await this.orderItemsRepo.softRemove({ id: item.id });
      }
    }
  }

  async checkAfterUpdateOrderMessage(orderId: string, event: OrderMessageEvent) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['shop.smsAccount', 'customer'],
    });
    const shop = order.shop;
    const customer = order.customer;

    if (customer?.mobilePhone && shop.smsAccount && shop.smsAccount.charge > 0) {
      this.orderMessagesRepo
        .find({
          where: {
            shop: { id: shop.id },
            smsTemplate: { isVerified: true },
            status: Status.Active,
          },
          relations: ['smsTemplate'],
        })
        .then((messages) => {
          if (messages.length) {
            let message: OrderMessage;

            if (event === OrderMessageEvent.OnChangeState) {
              message = OrderMessage.find(messages, order, OrderMessageEvent.OnChangeState);
            } else if (event === OrderMessageEvent.OnPayment) {
              message = OrderMessage.find(messages, order, OrderMessageEvent.OnPayment);
            } else if (event === OrderMessageEvent.OnEdit) {
              message = OrderMessage.find(messages, order, OrderMessageEvent.OnEdit);
            }

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
  }
}
