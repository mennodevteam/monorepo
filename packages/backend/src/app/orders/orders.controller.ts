import { Order, OrderDto } from '@menno/types';
import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {

  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    private ordersService: OrdersService,
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
}
