import { Menu, Order, OrderDto, OrderItem, Shop, User } from '@menno/types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>
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
        order.items.push(orderItem);
      } else {
        throw new HttpException(`product id ${item.productId} not found`, HttpStatus.NOT_FOUND);
      }
    }

    const abstractItems = Order.abstractItems(menu, order.items);
    order.items.push(...abstractItems);
    order.totalPrice = Order.total(menu, order.items);
    return order;
  }
}
