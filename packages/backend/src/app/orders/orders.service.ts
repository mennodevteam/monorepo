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
} from '@menno/types';
import { groupBy, groupBySum } from '@menno/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
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

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(DiscountCoupon)
    private discountCouponsRepo: Repository<DiscountCoupon>,
    @InjectRepository(OrderMessage)
    private orderMessagesRepo: Repository<OrderMessage>,
    private smsService: SmsService
  ) {}

  async dtoToOrder(dto: OrderDto) {
    const order = new Order();
    const shop = await this.shopsRepo.findOne({
      where: { id: dto.shopId },
      relations: [
        'menu.categories.products',
        'menu.costs.includeProductCategory',
        'menu.costs.includeProduct',
      ],
    });

    if (!shop) throw new HttpException('shop not found', HttpStatus.NOT_ACCEPTABLE);

    order.shop = <Shop>{ id: dto.shopId };
    if (dto.creatorId) order.creator = <User>{ id: dto.creatorId };
    if (dto.customerId) order.customer = <User>{ id: dto.customerId };
    if (dto.waiterId) order.waiter = <User>{ id: dto.waiterId };
    if (dto.details) order.details = dto.details;
    if (dto.id) order.id = dto.id;
    if (dto.isManual) order.isManual = dto.isManual;
    if (dto.note) order.note = dto.note;
    if (dto.address) order.address = dto.address;
    if (dto.payment) order.payment = dto.payment;
    if (dto.paymentType != undefined) order.paymentType = dto.paymentType;
    if (dto.state != undefined) order.state = dto.state;
    if (dto.type != undefined) order.type = dto.type;
    if (dto.discountCoupon)
      order.discountCoupon = await this.discountCouponsRepo.findOneBy({ id: dto.discountCoupon.id });

    const menu = shop.menu;
    Menu.setRefsAndSort(menu, dto.type);
    order.items = [...OrderDto.productItems(dto, menu), ...OrderDto.abstractItems(dto, menu)];

    for (const item of order.items) {
      if (item.product) item.product = { id: item.product.id } as Product;
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

    return await this.ordersRepo.save(order);
  }

  async report(dto: OrderReportDto) {
    const condition: FindOptionsWhere<Order> = {};

    condition.shop = { id: dto.shopId };

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
            date.setHours(date.getHours() - 3);
            return date.toDateString();
          },
          (order) => {
            return order.totalPrice;
          },
          dateDefaultKeys
        );
        break;
      case 'payment':
        data = groupBySum<Order>(
          orders,
          (order) => {
            return order.paymentType.toString();
          },
          (order) => {
            return order.totalPrice;
          }
        );
        break;
      case 'state':
        data = groupBySum<Order>(
          orders,
          (order) => {
            return order.state.toString();
          },
          (order) => {
            return order.totalPrice;
          }
        );
        break;
      case 'type':
        data = groupBySum<Order>(
          orders,
          (order) => {
            return order.type.toString();
          },
          (order) => {
            return order.totalPrice;
          }
        );
        break;
      case 'category':
        data = groupBySum<OrderItem>(
          orderItems.filter((x) => x.product?.category),
          (item) => {
            return item.product.category.id.toString();
          },
          (item) => {
            return item.price;
          }
        );
        break;
      case 'product':
        data = groupBySum<OrderItem>(
          orderItems.filter((x) => x.product),
          (item) => {
            return item.product.id;
          },
          (item) => {
            return item.quantity * item.price;
          }
        );
        break;
    }

    return data;
  }

  async editOrder(dto: OrderDto) {
    const order = await this.ordersRepo.findOne({
      where: { id: dto.id },
      relations: ['items.product', 'customer', 'shop'],
    });
    if (order.shop.id !== dto.shopId) {
      throw new HttpException('this order is for another shop', HttpStatus.FORBIDDEN);
    }
    if (order.paymentType) throw new HttpException('not allowed for payed orders', HttpStatus.NOT_ACCEPTABLE);

    if (order.customer) {
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
      const dtoItem = dto.productItems.find((x) => x.productId == item.product.id);
      if (!dtoItem) changes.push({ title: item.title, change: -1 * item.quantity });
      else if (dtoItem.quantity != item.quantity)
        changes.push({ title: item.title, change: dtoItem.quantity - item.quantity });
    }

    const newProductItems = editedOrder.items.filter(
      (x) => x.product && !order.items.find((y) => y.product && y.product.id === x.product.id)
    );
    for (const item of newProductItems) {
      changes.push({ title: item.title, change: item.quantity });
    }
    if (changes.length) editedOrder.details.itemChanges.push(changes);

    // const deletedItems = order.items.filter(
    //   (x) => x.product && !editedOrder.items.find((y) => y.product && y.product.id === x.product.id)
    // );
    // const newItems = editedOrder.items.filter(
    //   (x) => x.product && !order.items.find((y) => y.product && y.product.id === x.product.id)
    // );
    // const changedItems = editedOrder.items.filter(
    //   (x) =>
    //     x.product &&
    //     order.items.find((y) => y.product && y.product.id === x.product.id) &&
    //     order.items.find((y) => y.product && y.product.id === x.product.id).quantity !== x.quantity
    // );

    // if (deletedItems && deletedItems.length) {
    //   for (const item of deletedItems) {
    //     if (item.product && item.product.limitQuantity) {
    //       this.stockMicroservice
    //         .send('stockItems/setChanges', <QuantityLogDto>{
    //           businessId: order.shop.id,
    //           change: item.quantity,
    //           description: 'editOrder',
    //           itemId: item.product.id,
    //           userId: order.customerId,
    //         })
    //         .toPromise();
    //     }
    //   }
    // }

    // if (newItems && newItems.length) {
    //   for (const item of newItems) {
    //     if (item.product && item.product.limitQuantity) {
    //       this.stockMicroservice
    //         .send('stockItems/setChanges', <QuantityLogDto>{
    //           businessId: order.shop.id,
    //           change: -1 * item.quantity,
    //           description: 'editOrder',
    //           itemId: item.product.id,
    //           userId: order.customerId,
    //         })
    //         .toPromise();
    //     }
    //   }
    // }

    // if (changedItems && changedItems.length) {
    //   for (const item of changedItems) {
    //     if (item.product && item.product.limitQuantity) {
    //       let beforeEditOrder = order.items.find((x) => x.product.id === item.product.id);
    //       this.stockMicroservice
    //         .send('stockItems/setChanges', <QuantityLogDto>{
    //           businessId: order.shop.id,
    //           change: beforeEditOrder.quantity - item.quantity,
    //           description: 'editOrder',
    //           itemId: item.product.id,
    //           userId: order.customerId,
    //         })
    //         .toPromise();
    //     }
    //   }
    // }

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
    return this.ordersRepo.save(editedOrder);
  }

  async filter(dto: FilterOrderDto) {
    const condition: FindOptionsWhere<Order> = {};

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

    const relations = ['items.product', 'mergeTo', 'reviews', 'customer', 'creator', 'waiter'];
    let orders = await this.ordersRepo.find({
      where: condition,
      order: { createdAt: 'DESC' },
      relations,
      withDeleted: dto.withDeleted,
    });

    if (dto.hasReview) {
      orders = orders.filter((x) => x.reviews.length > 0);
    }

    return orders;
  }

  async manualSettlement(dto: ManualSettlementDto): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: dto.orderId },
      relations: ['shop', 'items.product'],
    });
    if (order && order.items.length > 0) {
      const perviousManualCost = order.items.find((x) => x.title === MANUAL_COST_TITLE && x.isAbstract);
      if (perviousManualCost) {
        order.totalPrice -= perviousManualCost.price;
        const index = order.items.findIndex((x) => x.id === perviousManualCost.id);
        order.items.splice(index, 1);
      }

      const perviousManualDiscount = order.items.find(
        (x) => x.title === MANUAL_DISCOUNT_TITLE && x.isAbstract
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
      // const member: Member = await this.clubMicroservice.send('members/filter', <FilterMemberDto>
      //     { userId: order.customerId, clubId: order.shop.clubId }).toPromise();
      // let wallet: Wallet;
      // wallet = await this.clubMicroservice.send('wallets/findWallet', member[0][0].id).toPromise()
      // member[0][0].wallet = wallet
      // let club: Club = await this.clubMicroservice.send('clubs/findOne', order.shop.clubId).toPromise();
      // if ((member[0][0].wallet.charge - Math.abs(order.totalPrice)) < (club.config.minMemberWalletCharge || 0)) {
      //     throw new RpcException({ code: HttpStatus.FORBIDDEN, message: 'The purchase amount is more than the amount of the wallet' })
      // }
      // let walletLogs = new WalletLogs();
      // walletLogs.user = order.creatorId;
      // walletLogs.amount = - Math.abs(order.totalPrice);
      // walletLogs.type = WalletLogType.PayOrder;
      // walletLogs.wallet = wallet;
      // await this.clubMicroservice.send('walletLogs/save', walletLogs).toPromise();
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
    const order = await this.ordersRepo.findOneBy({ id: orderId, shop: { id: shopId } });
    if (order) {
      if (description) order.details = { ...order.details, deletionReason: description };
      await this.ordersRepo.update(orderId, {
        state: OrderState.Canceled,
        details: order.details,
      });
      await this.ordersRepo.softDelete(orderId);
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
