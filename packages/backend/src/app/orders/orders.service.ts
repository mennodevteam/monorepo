import { FilterOrderDto, Menu, Order, OrderDto, OrderItem, Product, Shop, User } from '@menno/types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
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
        'menu.costs',
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
    if (dto.paymentType) order.paymentType = dto.paymentType;
    if (dto.state) order.state = dto.state;
    if (dto.type) order.type = dto.type;

    order.items = [];
    Menu.setRefsAndSort(shop.menu);
    const menu = shop.menu;
    for (const item of dto.productItems) {
      const product = Menu.getProductById(menu, item.productId);
      if (product) {
        const orderItem = new OrderItem(product, item.quantity);
        orderItem.product = <Product>{ id: item.productId };
        order.items.push(orderItem);
      } else {
        throw new HttpException(`product id ${item.productId} not found`, HttpStatus.NOT_FOUND);
      }
    }

    const abstractItems = Order.abstractItems(menu, order.items);
    order.items.push(...abstractItems);
    console.log(menu, order.items);
    order.totalPrice = Order.total(menu, order.items);
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
}
