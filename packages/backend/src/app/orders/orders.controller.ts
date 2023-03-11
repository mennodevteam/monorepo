import { FilterOrderDto, ManualSettlementDto, Order, OrderDto, User } from '@menno/types';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
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

  @Post()
  async save(@Body() dto: OrderDto, @LoginUser() user: AuthPayload) {
    if (user) {
      dto.creatorId = user.id;
      if (user.role === Role.App) {
        dto.customerId = user.id;
        delete dto.manualDiscount;
        delete dto.manualCost;
      } else if (user.role === Role.Panel) {
        const shop = await this.auth.getPanelUserShop(user);
        if (!shop) throw new HttpException('no shop found', HttpStatus.NOT_FOUND);
        dto.shopId = shop.id;
        dto.waiterId = user.id;
      }
    }
    return this.ordersService.addOrder(dto);
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
  @Roles(Role.App)
  getOrderDetailsApp(@Param('id') id: string) {
    return this.ordersRepo.findOne({
      where: {
        id,
      },
      relations: ['shop', 'shop.appConfig', 'items', 'customer', 'waiter', 'creator'],
    });
  }

  @Get('panel/:id')
  @Roles(Role.Panel)
  getOrderDetailsPanel(@Param('id') id: string) {
    return this.ordersRepo.findOne({
      where: {
        id,
      },
      relations: ['items', 'customer', 'waiter', 'creator', 'reviews', 'payment'],
    });
  }

  @Get('changeState/:id/:state')
  async changeState(
    @Param('id') id: string,
    @Param('state') state: string,
    @LoginUser() user: AuthPayload
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id }, relations: ['waiter'] });
    const update: Partial<Order> = {
      state: Number(state),
    };
    if (!order.waiter) update.waiter = { id: user.id } as User;
    await this.ordersRepo.update(order.id, update);
    return { ...order, ...update };
  }

  @Post('manualSettlement')
  async manualSettlement(@Body() body: ManualSettlementDto, @LoginUser() user: AuthPayload): Promise<Order> {
    return this.ordersService.manualSettlement(body);
  }

  @Get('setCustomer/:orderId/:memberId')
  async setCustomer(@Param('orderId') orderId: string, @Param('memberId') memberId: string) {
    return this.ordersService.setCustomer(orderId, memberId);
  }
}
