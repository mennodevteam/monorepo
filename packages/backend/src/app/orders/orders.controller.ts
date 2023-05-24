import {
  FilterOrderDto,
  ManualSettlementDto,
  Order,
  OrderDto,
  OrderReportDto,
  User,
  UserRole,
} from '@menno/types';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { OrdersService } from './orders.service';
import { SmsService } from '../sms/sms.service';

@Controller('orders')
export class OrdersController {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    private ordersService: OrdersService,
    private auth: AuthService,
    private sms: SmsService
  ) {}

  @Post()
  async save(@Body() dto: OrderDto, @LoginUser() user: AuthPayload) {
    if (user) {
      dto.creatorId = user.id;
      if (user.role === UserRole.App) {
        dto.customerId = user.id;
        delete dto.manualDiscount;
        delete dto.manualCost;
      } else if (user.role === UserRole.Panel) {
        const shop = await this.auth.getPanelUserShop(user);
        if (!shop) throw new HttpException('no shop found', HttpStatus.NOT_FOUND);
        dto.shopId = shop.id;
        dto.waiterId = user.id;
      }
    }
    if (dto.id) {
      return this.ordersService.editOrder(dto);
    } else {
      return this.ordersService.addOrder(dto);
    }
  }

  @Post('filter')
  async filterPanelOrders(@Body() dto: FilterOrderDto, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    dto.shopId = shop.id;
    return this.ordersService.filter(dto);
  }

  @Get()
  @Roles(UserRole.App)
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

  @Get('panel/:id')
  @Roles(UserRole.Panel)
  getOrderDetailsPanel(@Param('id') id: string) {
    return this.ordersRepo.findOne({
      where: {
        id,
      },
      relations: ['items.product', 'customer', 'waiter', 'creator', 'reviews', 'payment', 'address'],
    });
  }

  @Roles(UserRole.Panel)
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

  @Roles(UserRole.Panel)
  @Put('details/:id')
  async updateOrderDetails(
    @LoginUser() user: AuthPayload,
    @Param('id') id: string,
    @Body() body: any
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    const update: Partial<Order> = {
      details: {
        ...order.details,
        ...body,
      },
    };
    await this.ordersRepo.update(order.id, update);
    return { ...order, ...update };
  }

  @Post('manualSettlement')
  async manualSettlement(@Body() body: ManualSettlementDto, @LoginUser() user: AuthPayload): Promise<Order> {
    return this.ordersService.manualSettlement(body);
  }

  @Get('sendLinkToCustomer/:orderId')
  @Roles(UserRole.Panel)
  async sendLinkToCustomer(@Param('orderId') orderId: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['smsAccount']);
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['customer'] });
    if (order.customer?.mobilePhone && shop.smsAccount) {
      const shopLink = shop.domain || `${shop.username}.${process.env.APP_ORIGIN}`;
      return this.sms.send({
        accountId: shop.smsAccount.id,
        receptors: [order.customer.mobilePhone],
        messages: [
          `${order.customer?.firstName} عزیز، جهت مشاهده جزئیات و پیگیری سفارش خود در مجموعه ${shop.title} می‌توانید به لینک زیر مراجعه کنید. \n ${shopLink}`,
        ],
      });
    }
  }

  @Get('sendLinkToPeyk/:orderId/:phone')
  @Roles(UserRole.Panel)
  async sendLinkToPeyk(@Param('orderId') orderId: string, @Param('phone') phone: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['smsAccount']);
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['address', 'customer'],
    });
    if (order.address && shop.smsAccount && order.customer.mobilePhone) {
      return this.sms.send({
        accountId: shop.smsAccount.id,
        receptors: [phone],
        messages: [
          `فیش ${order.qNumber}\nمشتری: ${User.fullName(order.customer)}\nتلفن: ${order.customer.mobilePhone}\nآدرس: ${order.address.description}\nمسیریابی:\nmaps.google.com/?q=${order.address.latitude},${order.address.longitude}`,
        ],
      });
    }
  }

  @Post('report')
  @Roles(UserRole.Panel)
  async report(@Body() body: OrderReportDto, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    body.shopId = shop.id;
    return this.ordersService.report(body);
  }

  @Get('setCustomer/:orderId/:memberId')
  async setCustomer(@Param('orderId') orderId: string, @Param('memberId') memberId: string) {
    return this.ordersService.setCustomer(orderId, memberId);
  }

  @Get(':id')
  @Roles(UserRole.App)
  getOrderDetailsApp(@Param('id') id: string) {
    return this.ordersRepo.findOne({
      where: {
        id,
      },
      relations: ['shop', 'shop.appConfig', 'items', 'customer', 'waiter', 'creator', 'address'],
    });
  }
}
