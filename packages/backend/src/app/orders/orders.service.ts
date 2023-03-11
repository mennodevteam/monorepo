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
  Product,
  Shop,
  User,
} from '@menno/types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>
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
    if (dto.payment) order.payment = dto.payment;
    if (dto.paymentType != undefined) order.paymentType = dto.paymentType;
    if (dto.state != undefined) order.state = dto.state;
    if (dto.type != undefined) order.type = dto.type;

    const menu = shop.menu;
    Menu.setRefsAndSort(menu, dto.type);
    order.items = [...OrderDto.productItems(dto, menu), ...OrderDto.abstractItems(dto, menu)];

    for (const item of order.items) {
      if (item.product) item.product = { id: item.product.id } as Product;
    }

    order.totalPrice = OrderDto.total(dto, menu);
    return order;
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

    const relations = ['items', 'mergeTo', 'reviews', 'customer', 'creator', 'waiter'];
    if (dto.fillProductsAndCategory) {
      relations.push('items.product', 'items.product.category');
    }
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
    const order = await this.ordersRepo.findOne({ where: { id: dto.orderId }, relations: ['shop', 'items'] });
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

    await this.ordersRepo.update(order.id, {
      paymentType: dto.type,
      details: { ...order.details, posPayed: dto.posPayed },
    });
    return order;
  }

  async setCustomer(orderId: string, memberId: string) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['customer'] });
    if (order?.customer) throw new HttpException('order has customer', HttpStatus.CONFLICT);
    const member = await this.membersRepo.findOne({ where: { id: memberId }, relations: ['user'] });
    if (order && member)
      await this.ordersRepo.update(order.id, {
        customer: { id: member.user.id },
      });
      order.customer = member.user;
      return order;
  }
}
