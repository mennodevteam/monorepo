import {
  FilterOrderDto,
  ManualSettlementDto,
  Order,
  OrderDto,
  OrderMessageEvent,
  OrderReportDto,
  OrderItem,
  OrderState,
  User,
  UserRole,
} from '@menno/types';
import {
  Body,
  Controller,
  Delete,
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
import { In, Repository } from 'typeorm';
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
    private sms: SmsService,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
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

  @Roles(UserRole.Panel)
  @Post('filter')
  async filterPanelOrders(@Body() dto: FilterOrderDto, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    dto.shopId = shop.id;
    dto.withDeleted = true;
    return this.ordersService.filter(dto);
  }

  @Roles(UserRole.Panel)
  @Post('filter/v2')
  async filterPanelOrdersV2(@Body() dto: FilterOrderDto, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    dto.shopId = shop.id;
    dto.withDeleted = true;
    return this.ordersService.filter(dto, ['customer', 'address.region', 'address.deliveryArea']);
  }

  @Roles(UserRole.Panel)
  @Get('itemsMaterialCost/:orderId/:itemId/:materialCost')
  async updateOrderItemMaterialCost(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Param('materialCost') materialCost: string,
  ) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    const item = order.items.find((x) => x.id === itemId);
    if (!item) throw new HttpException('item not found', HttpStatus.NOT_FOUND);
    item.materialCost = Number(materialCost);
    await this.orderItemsRepo.update(itemId, { materialCost: item.materialCost });
    if (order.items.find((x) => !x.isAbstract && !x.materialCost)) return order;
    order.materialCost = order.items
      .filter((x) => x.materialCost)
      .reduce((acc, x) => acc + x.materialCost * x.quantity, 0);
    await this.ordersRepo.update(orderId, { materialCost: order.materialCost });
    return order;
  }

  @Roles(UserRole.Panel)
  @Get('extraCosts/:orderId/:extraCosts')
  async updateOrderExtraCosts(@Param('orderId') orderId: string, @Param('extraCosts') extraCosts: string) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    order.extraCosts = Number(extraCosts);
    await this.ordersRepo.update(orderId, { extraCosts: order.extraCosts });
    return order;
  }

  @Roles(UserRole.Panel)
  @Delete(':id')
  async deleteOrder(
    @Param('id') id: string,
    @Query('description') description: string,
    @LoginUser() user: AuthPayload,
  ) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.ordersService.remove(id, shop?.id, description);
  }

  @Get()
  @Roles(UserRole.App)
  getMyOrders(@LoginUser() user: AuthPayload, @Query('skip', ParseIntPipe) skip = 0) {
    return this.ordersRepo.find({
      take: 25,
      skip,
      withDeleted: true,
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
  async getOrderDetailsPanel(@Param('id') id: string, @Query('withProduct') withProduct: string) {
    const relations = [
      'items.product',
      'items.productVariant',
      'customer',
      'waiter',
      'creator',
      'reviews',
      'payment',
      'address.deliveryArea',
      'address.region',
      'discountCoupon',
    ];

    if (withProduct) {
      relations.push('items.product', 'items.productVariant');
    }

    const order = await this.ordersRepo.findOne({
      where: {
        id,
      },
      withDeleted: true,
      relations,
      order: {
        items: {
          isAbstract: 'ASC',
        },
      },
    });

    if (!order?.seenAt) {
      this.ordersRepo.update(id, { seenAt: new Date() });
      order.seenAt = new Date();
    }

    return order;
  }

  @Roles(UserRole.Panel)
  @Get('changeState/:id/:state')
  async changeState(
    @Param('id') id: string,
    @Param('state') state: string,
    @LoginUser() user: AuthPayload,
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id }, relations: ['waiter'] });
    const update: Partial<Order> = {
      state: Number(state),
    };
    if (!order.waiter) update.waiter = { id: user.id } as User;
    await this.ordersRepo.update(order.id, update);
    this.ordersService.checkAfterUpdateOrderMessage(id, OrderMessageEvent.OnChangeState);
    return { ...order, ...update };
  }

  @Roles(UserRole.Panel)
  @Post('merge')
  async mergeOrders(@Body() dto: string[], @LoginUser() user: AuthPayload): Promise<Order> {
    const orders = await this.ordersRepo.find({
      where: { id: In(dto) },
      relations: [
        'items.product',
        'items.productVariant',
        'customer',
        'waiter',
        'creator',
        'shop',
        'reviews',
        'payment',
        'address.deliveryArea',
      ],
    });

    const mergeOrder = Order.merge(
      orders,
      orders.find((x) => x.id === dto[0]),
    );
    mergeOrder.updatedAt = new Date();
    mergeOrder.isManual = true;
    if (mergeOrder) {
      const merged = await this.ordersRepo.save(mergeOrder);
      for (const o of orders) {
        await this.ordersRepo.update(o.id, { mergeTo: { id: merged.id } });
        this.ordersRepo.softDelete(o.id);
      }
      return mergeOrder as Order;
    }
  }

  @Roles(UserRole.Panel)
  @Put('details/:id')
  async updateOrderDetails(
    @LoginUser() user: AuthPayload,
    @Param('id') id: string,
    @Body() body: any,
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
    return this.ordersService.manualSettlement(body, user);
  }

  @Get('sendLinkToCustomer/:orderId')
  @Roles(UserRole.Panel)
  async sendLinkToCustomer(@Param('orderId') orderId: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['smsAccount']);
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['customer'] });
    if (order.customer?.mobilePhone && shop.smsAccount) {
      const orderLink = Order.getLink(
        order.id,
        shop,
        process.env.APP_ORIGIN,
        process.env.APP_ORDER_PAGE_PATH,
      );
      return this.sms.send({
        accountId: shop.smsAccount.id,
        receptors: [order.customer.mobilePhone],
        messages: [
          `${order.customer?.firstName} عزیز، جهت مشاهده جزئیات و پیگیری سفارش خود در مجموعه ${shop.title} می‌توانید به لینک زیر مراجعه کنید. \n ${orderLink}`,
        ],
      });
    }
  }

  @Get('sendLinkToPeyk/:orderId/:phone')
  @Roles(UserRole.Panel)
  async sendLinkToPeyk(
    @Param('orderId') orderId: string,
    @Param('phone') phone: string,
    @LoginUser() user: AuthPayload,
  ) {
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
          `فیش ${order.qNumber}\nمشتری: ${User.fullName(order.customer)}\nتلفن: ${
            order.customer.mobilePhone
          }\nآدرس: ${order.address.description}\nمسیریابی:\nmaps.google.com/?q=${order.address.latitude},${
            order.address.longitude
          }`,
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

  @Get('product-order-counts')
  @Roles(UserRole.Panel)
  async getProductOrderCounts(@LoginUser() user: AuthPayload): Promise<Record<string, number>> {
    const shop = await this.auth.getPanelUserShop(user);
    if (!shop) {
      throw new HttpException('Shop not found', HttpStatus.NOT_FOUND);
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get order items from the last 30 days
    const orderItems = await this.orderItemsRepo
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.productVariant', 'productVariant')
      .select('product.id', 'productId')
      .addSelect('productVariant.id', 'variantId')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
      .where('order.shop = :shopId', { shopId: shop.id })
      .andWhere('order.state != :canceledState', { canceledState: OrderState.Canceled })
      .andWhere('order.excludeFromReports = :excludeFromReports', { excludeFromReports: false })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('order.createdAt >= :fromDate', { fromDate: thirtyDaysAgo })
      .andWhere('orderItem.isAbstract = :isAbstract', { isAbstract: false })
      .andWhere('orderItem.product IS NOT NULL')
      .groupBy('product.id')
      .addGroupBy('productVariant.id')
      .getRawMany();

    // Convert to a map for easy lookup
    const countsMap: Record<string, number> = {};
    for (const item of orderItems) {
      const key = item.variantId
        ? `${item.productId}-${item.variantId}`
        : `${item.productId}-null`;
      countsMap[key] = parseInt(item.totalQuantity) || 0;
    }

    return countsMap;
  }

  @Get(':id')
  @Roles(UserRole.App)
  getOrderDetailsApp(@Param('id') id: string) {
    return this.ordersRepo.findOne({
      where: {
        id,
      },
      withDeleted: true,
      relations: [
        'shop',
        'shop.appConfig',
        'items',
        'customer',
        'waiter',
        'creator',
        'address',
        'shop.paymentGateway',
      ],
    });
  }
}
