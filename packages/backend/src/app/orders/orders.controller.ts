import { FilterOrderDto, Order, OrderDto } from '@menno/types';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { Roles } from '../auth/roles.decorators';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    private ordersService: OrdersService,
    private auth: AuthService
  ) {}

  @Public()
  @Post()
  async save(@Body() dto: OrderDto, @LoginUser() user: AuthPayload) {
    if (user) {
      dto.creatorId = user.id;
      if (user.role === Role.App) dto.customerId = user.id;
      else if (user.role === Role.Panel) dto.waiterId = user.id;
    }

    const order = await this.ordersService.dtoToOrder(dto);
    const savedOrder = await this.ordersRepo.save(order);
    return savedOrder;
  }

  @Post('filter')
  async filterPanelOrders(@Body() dto: FilterOrderDto, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    dto.shopId = shop.id;
    return this.ordersService.filter(dto);
  }

  @Get()
  @Roles(Role.App)
  getMyOrders(@LoginUser() user: AuthPayload, @Query('skip', ParseIntPipe) skip = 0) {
    return this.ordersRepo.find({
      take: 25,
      skip,
      where: {
        customer: { id: user.id },
      },
      relations: ['shop', 'items'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Get(':id')
  getOrderDetails(@Param('id') id: string) {
    return this.ordersRepo.findOne({
      where: {
        id,
      },
      relations: ['shop', 'shop.appConfig', 'items', 'customer', 'waiter', 'creator', 'reviews'],
    });
  }
}
