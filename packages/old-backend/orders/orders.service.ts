import {
  Club,
  DeliveryArea,
  DiscountCoupon,
  FilterDiscountCouponsDto,
  FilterMemberDto,
  FilterOrderDto,
  ManualSettlementDto,
  Member,
  Order,
  OrderDetails,
  OrderDto,
  OrderItem,
  OrderReview,
  OrderState,
  OrderType,
  Product,
  QuantityLogDto,
  Shop,
  User,
  Wallet,
  WalletLog,
  WalletLogType,
} from '@menno/types';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  ClubMicroservice,
  SmsMicroservice,
  StockMicroservice,
  UserMicroservice,
} from '../core/microservices';
import { DeliveryAreasService } from '../delivery-areas/delivery-areas.service';
import { MenusService } from '../menus/menus.service';
import { ShopsService } from '../shops/shops.service';
import { OrderConfigsService } from './order-configs.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(OrderReview)
    private orderReviewsRepository: Repository<OrderReview>,
    private shopsService: ShopsService,
    private menusService: MenusService,
    private configsService: OrderConfigsService,
    private deliverAreasService: DeliveryAreasService,
    @Inject(ClubMicroservice.name) private clubMicroservice: ClientProxy,
    @Inject(UserMicroservice.name) private userMicroservice: ClientProxy,
    @Inject(SmsMicroservice.name) private smsMicroservice: ClientProxy,
    @Inject(StockMicroservice.name) private stockMicroservice: ClientProxy
  ) {}

  async changeProperties(order: Order): Promise<Order> {
    const newOrder = <Order>{
      id: order.id,
    };
    if (order.details !== undefined) newOrder.details = order.details;
    if (order.isPayed !== undefined) newOrder.isPayed = order.isPayed;
    if (order.state !== undefined) newOrder.state = order.state;
    if (order.waiter !== undefined) newOrder.waiter = order.waiter;
    return this.ordersRepository.save(newOrder);
  }

  async manualSettlement(dto: ManualSettlementDto) {
    const order = await this.ordersRepository.findOne({
      where: { id: dto.orderId },
      relations: ['shop', 'items', 'customer', 'waiter', 'creator'],
    });
    if (order && order.items.length > 0) {
      const perviousManualCost = order.items.find(
        (x) => x.title === 'manualCost'
      );
      if (perviousManualCost) {
        order.totalPrice -= perviousManualCost.price;
        const index = order.items.findIndex(
          (x) => x.id === perviousManualCost.id
        );
        order.items.splice(index, 1);
      }

      const perviousManualDiscount = order.items.find(
        (x) => x.title === 'manualDiscount'
      );
      if (perviousManualDiscount) {
        order.totalPrice += Math.abs(perviousManualDiscount.price);
        const index = order.items.findIndex(
          (x) => x.id === perviousManualDiscount.id
        );
        order.items.splice(index, 1);
      }
    }

    if (dto.manualDiscount) {
      order.totalPrice = order.totalPrice - Math.abs(dto.manualDiscount);
      order.items.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.abs(dto.manualDiscount) * -1,
        title: 'manualDiscount',
      });
    }

    if (dto.manualCost) {
      order.totalPrice = order.totalPrice + Math.abs(dto.manualCost);
      order.items.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.abs(dto.manualCost),
        title: 'manualCost',
      });
    }

    if (dto.isFromWallet) {
      const member: Member = await this.clubMicroservice
        .send('members/filter', <FilterMemberDto>{
          userId: order.customer.id,
          clubId: order.shop.clubId,
        })
        .toPromise();

      const wallet: Wallet = await this.clubMicroservice
        .send('wallets/findWallet', member[0][0].id)
        .toPromise();
      member[0][0].wallet = wallet;
      const club: Club = await this.clubMicroservice
        .send('clubs/findOne', order.shop.clubId)
        .toPromise();
      if (
        member[0][0].wallet.charge - Math.abs(order.totalPrice) <
        (club.config.minMemberWalletCharge || 0)
      ) {
        throw new RpcException({
          code: HttpStatus.FORBIDDEN,
          message: 'The purchase amount is more than the amount of the wallet',
        });
      }

      const walletLogs = new WalletLog();
      walletLogs.user = order.creator;
      walletLogs.amount = -Math.abs(order.totalPrice);
      walletLogs.type = WalletLogType.PayOrder;
      walletLogs.wallet = wallet;
      await this.clubMicroservice
        .send('walletLogs/save', walletLogs)
        .toPromise();
    }

    order.isPayed = true;
    order.details.paymentType = dto.isFromWallet ? 'clubWallet' : 'cash';
    order.details.posPayed = dto.isFromWallet ? undefined : dto.posPayed;
    console.log(order.items, order.totalPrice);
    return this.ordersRepository.save(order);
  }

  async sendOrderLinkToCustomer(orderId: string, order?: Order): Promise<void> {
    if (!order) order = await this.findOne(orderId);
    if (order.customer && order.shop.smsAccountId) {
      const tokens: string[] = [];
      tokens[0] = order.id;
      tokens[3] = User.fullName(order.customer);
      tokens[4] = order.shop.title;
      this.smsMicroservice
        .send('sms/lookup', {
          accountId: order.shop.smsAccountId,
          mobilePhone: order.customer.mobilePhone,
          kavenagarTemplate: process.env.ORDER_LINK_KAVENEGAR_TEMPLATE,
          tokens,
        })
        .toPromise();
    }
  }

  async insert(dto: OrderDto): Promise<Order> {
    const order = await this.dtoToOrder(dto);
    return this.ordersRepository.save(order);
  }

  async edit(dto: OrderDto): Promise<Order> {
    const order = await this.findOne(dto.id);
    if (order.shop.id !== dto.shopId) {
      throw new RpcException({
        code: HttpStatus.FORBIDDEN,
        message: 'this order is for another shop',
      });
    }
    if (order.isPayed)
      throw new RpcException({
        code: HttpStatus.NOT_ACCEPTABLE,
        message: 'not allowed for payed orders',
      });
    if (order.customer) {
      dto.customerId = undefined;
    }
    dto.creatorId = undefined;
    const editedOrder = await this.dtoToOrder(dto);
    editedOrder.id = dto.id;

    // set prev details
    for (const key in order.details) {
      if (
        Object.prototype.hasOwnProperty.call(order.details, key) &&
        !Object.prototype.hasOwnProperty.call(editedOrder.details, key)
      ) {
        editedOrder.details[key] = order.details[key];
      }
    }

    // create changes value
    if (!editedOrder.details) editedOrder.details = {};
    if (!editedOrder.details.itemChanges) editedOrder.details.itemChanges = [];
    const changes: {
      title: string;
      change: number;
    }[] = [];

    for (const item of order.items) {
      if (item.isAbstract || !item.product) continue;
      const dtoItem = dto.productItems.find(
        (x) => x.productId == item.product.id
      );
      if (!dtoItem)
        changes.push({ title: item.title, change: -1 * item.quantity });
      else if (dtoItem.quantity != item.quantity)
        changes.push({
          title: item.title,
          change: dtoItem.quantity - item.quantity,
        });
    }

    const newProductItems = editedOrder.items.filter(
      (x) =>
        x.product &&
        !order.items.find((y) => y.product && y.product.id === x.product.id)
    );
    for (const item of newProductItems) {
      changes.push({ title: item.title, change: item.quantity });
    }
    if (changes.length) editedOrder.details.itemChanges.push(changes);

    const deletedItems = order.items.filter(
      (x) =>
        x.product &&
        !editedOrder.items.find(
          (y) => y.product && y.product.id === x.product.id
        )
    );
    const newItems = editedOrder.items.filter(
      (x) =>
        x.product &&
        !order.items.find((y) => y.product && y.product.id === x.product.id)
    );
    const changedItems = editedOrder.items.filter(
      (x) =>
        x.product &&
        order.items.find((y) => y.product && y.product.id === x.product.id) &&
        order.items.find((y) => y.product && y.product.id === x.product.id)
          .quantity !== x.quantity
    );

    if (deletedItems && deletedItems.length) {
      for (const item of deletedItems) {
        if (item.product && item.product.limitQuantity) {
          this.stockMicroservice
            .send('stockItems/setChanges', <QuantityLogDto>{
              businessId: order.shop.id,
              change: item.quantity,
              description: 'editOrder',
              itemId: item.product.id,
              userId: order.customer?.id,
            })
            .toPromise();
        }
      }
    }

    if (newItems && newItems.length) {
      for (const item of newItems) {
        if (item.product && item.product.limitQuantity) {
          this.stockMicroservice
            .send('stockItems/setChanges', <QuantityLogDto>{
              businessId: order.shop.id,
              change: -1 * item.quantity,
              description: 'editOrder',
              itemId: item.product.id,
              userId: order.customer?.id,
            })
            .toPromise();
        }
      }
    }

    if (changedItems && changedItems.length) {
      for (const item of changedItems) {
        const beforeEditOrder = order.items.find(
          (x) => x.product.id === item.product.id
        );
        if (item.product && item.product.limitQuantity) {
          this.stockMicroservice
            .send('stockItems/setChanges', <QuantityLogDto>{
              businessId: order.shop.id,
              change: beforeEditOrder.quantity - item.quantity,
              description: 'editOrder',
              itemId: item.product.id,
              userId: order.customer?.id,
            })
            .toPromise();
        }
      }
    }

    delete editedOrder.qNumber;
    delete editedOrder.creator;
    delete editedOrder.shop;
    delete editedOrder.state;
    delete editedOrder.isPayed;
    delete editedOrder.isManual;
    delete editedOrder.mergeTo;
    delete editedOrder.mergeFrom;
    delete editedOrder.reviews;
    return this.ordersRepository.save(editedOrder);
  }

  async dtoToOrder(dto: OrderDto): Promise<Order> {
    const shop = await this.shopsService.findOne(dto.shopId);
    const menu = await this.menusService.findOne(shop.menuId);
    const orderConfig = await this.configsService.findOne(shop.id);

    const lastOrder = await this.ordersRepository.findOne({
      where: {
        shop: { id: shop.id },
        qNumber: Not(IsNull()),
      },
      order: {
        createdAt: 'DESC',
      },
    });
    const order = new Order();
    order.details = dto.details || {};
    order.details.currency = menu.currency;
    if (dto.details.table) {
      try {
        const orderTable = shop.details.tables.find(
          (x) => x.code === dto.details.table
        );
        order.details.table = orderTable.code;
        if (orderTable.title)
          order.details.table = `${order.details.table} - ${orderTable.title}`;
      } catch (error) {
        console.log(error);
      }
    }
    let member: Member;

    if (shop.clubId && dto.customerId) {
      const members = await this.clubMicroservice
        .send<[Member[], number]>('members/filter', <FilterMemberDto>{
          clubId: shop.clubId,
          userId: dto.customerId,
        })
        .toPromise();

      if (members[1] === 1) {
        member = members[0][0];
      }
    }

    if (lastOrder) {
      const orderDate = new Date(lastOrder.createdAt);
      if (orderDate.toDateString() === new Date().toDateString()) {
        order.qNumber = lastOrder.qNumber + 1;
      }
    }

    if (!order.qNumber) {
      if (orderConfig && orderConfig.qNumberStart) {
        order.qNumber = orderConfig.qNumberStart;
      } else {
        order.qNumber = 1;
      }
    }
    order.packOrderId = dto.packOrderId;
    order.customer = <User>{ id: dto.customerId };
    order.creator = <User>{ id: dto.creatorId };
    order.shop = <Shop>{ id: dto.shopId };
    order.state = dto.state;
    order.type = dto.type;
    order.isPayed = dto.isPayed;
    order.isManual = dto.isManual;
    if (order.isManual) order.waiter = <User>{ id: dto.creatorId };
    order.items = [];
    order.totalPrice = 0;
    const costs = menu.costs.filter(
      (x) =>
        !x.orderTypes ||
        !x.orderTypes.length ||
        x.orderTypes.indexOf(dto.type) > -1
    );

    let shopAllProducts: Product[] = [];
    for (const cat of menu.categories) {
      shopAllProducts = [...shopAllProducts, ...cat.products];
    }

    let sum = 0;
    for (const item of dto.productItems) {
      const product = shopAllProducts.find((x) => x.id === item.productId);
      let productPrice = product.price;

      for (const cost of costs) {
        if (!cost.showOnItem) continue;
        let includeProductIds = cost.includeProductIds || [];
        if (cost.includeProductCategoryIds) {
          for (const catId of cost.includeProductCategoryIds) {
            const category = menu.categories.find((x) => x.id === catId);
            if (category && category.products)
              includeProductIds = [
                ...includeProductIds,
                ...category.products.map((x) => x.id),
              ];
          }
        }

        if (
          !includeProductIds ||
          !includeProductIds.length ||
          includeProductIds.indexOf(product.id) > -1
        ) {
          if (cost.fixedCost) productPrice += cost.fixedCost;
          else if (cost.percentageCost)
            productPrice += product.price * (cost.percentageCost / 100);
        }
      }

      order.items.push(<OrderItem>{
        title: product.title,
        product: product,
        quantity: item.quantity,
        price: productPrice,
      });
      sum += item.quantity * productPrice;
    }

    for (const cost of costs) {
      if (cost.showOnItem) continue;
      let includeProductIds = cost.includeProductIds || [];
      if (cost.includeProductCategoryIds) {
        for (const catId of cost.includeProductCategoryIds) {
          const category = menu.categories.find((x) => x.id === catId);
          if (category && category.products)
            includeProductIds = [
              ...includeProductIds,
              ...category.products.map((x) => x.id),
            ];
        }
      }
      if (includeProductIds.length) {
        const includedItems = order.items.filter(
          (x) => x.product && includeProductIds.indexOf(x.product.id) > -1
        );
        let price = 0;
        for (const item of includedItems) {
          price += cost.fixedCost * item.quantity;
          if (cost.percentageCost) {
            price += item.price * (cost.percentageCost / 100) * item.quantity;
          }
        }
        if (price) {
          order.items.push(<OrderItem>{
            price,
            isAbstract: true,
            quantity: 1,
            title: cost.title,
          });
        }
      } else {
        let price = cost.fixedCost;
        if (cost.percentageCost) {
          price += sum * (cost.percentageCost / 100);
        }
        order.items.push(<OrderItem>{
          price,
          isAbstract: true,
          quantity: 1,
          title: cost.title,
        });
      }
    }

    if (dto.type === OrderType.Delivery) {
      let area: DeliveryArea;
      if (dto.details.deliveryAreaId) {
        area = await this.deliverAreasService.findById(
          dto.details.deliveryAreaId
        );
      }
      if (dto.details.latitude && dto.details.longitude) {
        area = await this.deliverAreasService.findShopDeliveryAreaInPoint(
          dto.shopId,
          [dto.details.latitude, dto.details.longitude]
        );
      }
      const item = <OrderItem>{
        title: 'deliveryCost',
        quantity: 1,
        isAbstract: true,
      };
      if (area.minPriceForFree && area.minPriceForFree <= sum) item.price = 0;
      else item.price = area.price;
      order.items.push(item);
    }

    if (dto.details && dto.details.discountCouponId) {
      const discountCoupon: DiscountCoupon = await this.clubMicroservice
        .send('discountsCoupon/findOne', dto.details.discountCouponId)
        .toPromise();
      let isCouponValid = false;
      if (discountCoupon && discountCoupon.club.id === shop.clubId) {
        if (discountCoupon.member) {
          if (
            discountCoupon.member &&
            member &&
            discountCoupon.member.id === member.id
          ) {
            const memberValidCoupons: DiscountCoupon[] =
              await this.clubMicroservice
                .send('discountsCoupon/filter', <FilterDiscountCouponsDto>{
                  clubId: shop.clubId,
                  memberId: member.id,
                  isEnabled: true,
                })
                .toPromise();

            if (memberValidCoupons.find((x) => x.id === discountCoupon.id))
              isCouponValid = true;
          }
        } else {
          isCouponValid = true;
        }
      }

      if (isCouponValid) {
        let couponPrice = 0;
        if (discountCoupon.fixedDiscount)
          couponPrice = discountCoupon.fixedDiscount;
        if (discountCoupon.percentageDiscount) {
          couponPrice = (sum * discountCoupon.percentageDiscount) / 100;
          if (discountCoupon.maxDiscount)
            couponPrice = Math.min(couponPrice, discountCoupon.maxDiscount);
        }
        order.items.push(<OrderItem>{
          price: couponPrice * -1,
          quantity: 1,
          isAbstract: true,
          title: 'discountCoupon',
        });
      }
    } // end of discount coupon check

    order.totalPrice = 0;
    for (const item of order.items) {
      order.totalPrice += item.quantity * item.price;
    }
    if (dto.manualCost !== undefined) {
      order.totalPrice += dto.manualCost;
      order.items.push(<OrderItem>{
        price: dto.manualCost,
        quantity: 1,
        isAbstract: true,
        title: 'manualCost',
      });
    }
    if (dto.manualDiscount !== undefined) {
      order.totalPrice -= Math.abs(dto.manualDiscount);
      order.items.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.abs(dto.manualDiscount) * -1,
        title: 'manualDiscount',
      });
    }
    return order;
  }

  async filter(filterDto: FilterOrderDto): Promise<Order[]> {
    const condition: FindOptionsWhere<Order> = {};

    if (filterDto.fromDate && filterDto.toDate) {
      condition.createdAt = Between(filterDto.fromDate, filterDto.toDate);
    } else if (filterDto.fromDate) {
      condition.createdAt = MoreThanOrEqual(filterDto.fromDate);
    } else if (filterDto.toDate) {
      condition.createdAt = LessThanOrEqual(filterDto.toDate);
    }

    if (filterDto.shopId) condition.shop = { id: filterDto.shopId };
    if (filterDto.states) condition.state = In(filterDto.states);
    if (filterDto.types) condition.type = In(filterDto.types);
    if (filterDto.isPayed === true || filterDto.isPayed === false)
      condition.isPayed = filterDto.isPayed;

    if (filterDto.customerId === null) {
      condition.customer = IsNull();
    } else if (filterDto.customerId) {
      condition.customer = { id: filterDto.customerId };
    }

    if (filterDto.creatorId === null) {
      condition.creator = IsNull();
    } else if (filterDto.creatorId) {
      condition.creator = { id: filterDto.creatorId };
    }
    if (filterDto.waiterId === null) {
      condition.waiter = IsNull();
    } else if (filterDto.waiterId) {
      condition.waiter = { id: filterDto.waiterId };
    }
    if (filterDto.isManual === true || filterDto.isManual === false)
      condition.isManual = filterDto.isManual;

    const relations = [
      'items',
      'mergeTo',
      'reviews',
      'customer',
      'creator',
      'waiter',
    ];
    if (filterDto.fillProductsAndCategory) {
      relations.push('items.product', 'items.product.category');
      console.log(relations);
    }
    let orders = await this.ordersRepository.find({
      where: condition,
      order: { createdAt: 'DESC' },
      relations,
      withDeleted: filterDto.withDeleted,
    });
    if (filterDto.paymentType) {
      orders = orders.filter(
        (x) =>
          x.isPayed &&
          x.details &&
          x.details.paymentType === filterDto.paymentType
      );
    }

    if (filterDto.hasReview) {
      orders = orders.filter((x) => x.reviews.length > 0);
    }

    return orders;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'items',
        'shop',
        'items.product',
        'items.product.category',
        'mergeTo',
        'reviews',
        'waiter',
        'creator',
        'customer',
      ],
      withDeleted: true,
    });

    return order;
  }

  async setCustomer(dto: {
    orderId: string;
    customerId: string;
  }): Promise<Order> {
    const order = await this.ordersRepository.findOneBy({ id: dto.orderId });
    if (!order.customer) {
      order.customer = <User>{ id: dto.customerId };
      return await this.ordersRepository.save(order);
    } else {
      throw new RpcException({
        code: 400,
        message: 'The order has already been registered by Customer',
      });
    }
  }

  async groupOrders(ids: string[]): Promise<any> {
    const orders = await this.ordersRepository.find({
      where: {
        id: In(ids),
      },
      relations: ['shop', 'items', 'items.product'],
    });
    if (!orders || !orders.length) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'no order found for these ids',
      });
    }
    try {
      orders.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    } catch (error) {}

    let groupedOrders = new Order();
    groupedOrders.items = [];
    groupedOrders.mergeFrom = [];
    groupedOrders.totalPrice = 0;
    groupedOrders.customer =
      orders.filter((x) => x.customer).length == 1
        ? orders.find((x) => x.customer).customer
        : orders[0].customer;
    groupedOrders.state = orders[0].state;
    groupedOrders.type = orders[0].type;
    groupedOrders.isPayed = false;
    groupedOrders.waiter = orders[0].waiter;
    for (const o of orders) {
      if (o.isPayed !== groupedOrders.isPayed) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'These orders are not allowed to be grouped',
        });
      }

      for (const item of o.items) {
        if (item.product) {
          const existItem = groupedOrders.items.find(
            (x) =>
              x.product &&
              x.product.id == item.product.id &&
              x.price == item.price
          );
          if (existItem) {
            existItem.quantity += item.quantity;
          } else {
            groupedOrders.items.push(<OrderItem>{
              price: item.price,
              quantity: item.quantity,
              details: item.details,
              isAbstract: item.isAbstract,
              product: item.product,
              title: item.title,
            });
          }
        } else {
          const abstractOrder = groupedOrders.items.find(
            (x) => x.title === item.title
          );
          if (abstractOrder) {
            abstractOrder.price += item.price;
          } else {
            groupedOrders.items.push(<OrderItem>{
              price: item.price,
              quantity: item.quantity,
              details: item.details,
              isAbstract: item.isAbstract,
              product: item.product,
              title: item.title,
            });
          }
        }
        groupedOrders.totalPrice += item.quantity * item.price;
      }
    }
    groupedOrders.creator = orders[0].creator;
    groupedOrders.details = orders[0].details;
    groupedOrders.createdAt = orders[0].createdAt;
    groupedOrders.shop = orders[0].shop;
    groupedOrders.mergeFrom = orders.map((x) => x.id);
    groupedOrders.creator = orders[0].creator;
    groupedOrders.qNumber = Math.max(...orders.map((x) => x.qNumber));
    groupedOrders.isManual = true;
    groupedOrders = await this.ordersRepository.save(groupedOrders);

    for (const o of orders) {
      o.mergeTo = <Order>{ id: groupedOrders.id };
      await this.ordersRepository.save(o);
      await this.ordersRepository.softDelete(o.id);
    }
    return groupedOrders;
  }

  addOrderReview(orderReview: OrderReview): Promise<OrderReview> {
    return this.orderReviewsRepository.save(orderReview);
  }

  async delete(dto: { id: string; deletionReason: string }): Promise<void> {
    const paymentStatus = await this.ordersRepository.findOneBy({ id: dto.id });
    if (paymentStatus && paymentStatus.isPayed != true) {
      paymentStatus.details.deletionReason = dto.deletionReason;
      paymentStatus.state = OrderState.Canceled;
      await this.ordersRepository.save(paymentStatus);
      await this.ordersRepository.softDelete(dto.id);
      const order = await this.findOne(dto.id);
      for (const item of order.items) {
        if (item.product && item.product.limitQuantity) {
          this.stockMicroservice
            .send('stockItems/setChanges', <QuantityLogDto>{
              businessId: order.shop.id,
              change: item.quantity,
              description: 'remove order',
              itemId: item.product.id,
              userId: order.customerId,
            })
            .toPromise();
        }
      }
    } else {
      throw new RpcException({
        status: 403,
        message:
          'This order has been paid for and you are not allowed to delete it',
      });
    }
  }

  async UnGroupOrders(orderId: string): Promise<Order[]> {
    const groupedOrder = await this.ordersRepository.findOneBy({ id: orderId });
    const unGroupOrders: Order[] = [];
    if (groupedOrder.mergeFrom && !groupedOrder.isPayed) {
      for (const mergeFromId of groupedOrder.mergeFrom) {
        const orderMerged = await this.ordersRepository.findOne({
          where: { id: mergeFromId },
          relations: ['items', 'reviews'],
          withDeleted: true,
        });
        orderMerged.mergeTo = null;
        orderMerged.deletedAt = null;
        this.ordersRepository.save(orderMerged);
        unGroupOrders.push(orderMerged);
      }
      this.ordersRepository.softDelete(groupedOrder.id);
      return unGroupOrders;
    } else {
      throw new RpcException({
        status: HttpStatus.METHOD_NOT_ALLOWED,
        message: 'this order is Payed or deleted And Not allowed to delete',
      });
    }
  }

  async editOrderDetails(dto: {
    orderId: string;
    orderDetails: OrderDetails;
  }): Promise<void> {
    const order = await this.ordersRepository.findOneBy({ id: dto.orderId });
    for (const key in order.details) {
      if (Object.prototype.hasOwnProperty.call(dto.orderDetails, key)) {
        order.details[key] = dto.orderDetails[key];
      }
    }
    this.ordersRepository.update(order.id, { details: order.details });
  }

  findByPackOrderIds(ids: string[]): Promise<Order[]> {
    return this.ordersRepository.find({
      where: {
        packOrderId: In(ids),
      },
      relations: ['shop'],
    });
  }
}
