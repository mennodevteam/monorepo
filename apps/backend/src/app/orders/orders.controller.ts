import {
  FilterOrderDto,
  ManualSettlementDto,
  Order,
  OrderDto,
  OrderMessageEvent,
  OrderReportDto,
  OrderItem,
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
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { OrdersService } from './orders.service';
import { SmsService } from '../sms/sms.service';
import { Public } from '../auth/public.decorator';
import * as pd from 'persian-date';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

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

  // TEMPORARY: Public endpoint to backfill Persian date fields for existing orders
  // TODO: Remove this after backfilling is complete
  @Public()
  @Get('temp/backfill-persian-dates')
  async backfillPersianDates(@Query('batchSize') batchSize = '1000') {
    const BATCH_SIZE = Math.min(Number(batchSize) || 1000, 5000); // Max 5000 per batch
    this.logger.log(`🚀 Starting Persian date fields backfill with batch size: ${BATCH_SIZE}`);
    
    try {
      // Get count of orders that need backfilling
      this.logger.log('📊 Counting orders that need backfilling...');
      const totalCount = await this.ordersRepo.count({
        where: {
          createdAtLocalDate: IsNull(),
        },
      });

      if (totalCount === 0) {
        this.logger.log('✅ All orders already have Persian date fields populated!');
        return {
          success: true,
          message: 'All orders already have Persian date fields populated!',
          processed: 0,
          total: 0,
        };
      }

      this.logger.log(`📊 Found ${totalCount} orders to backfill`);

      let processed = 0;
      let errors = 0;
      const startTime = Date.now();
      let batchNumber = 0;
      const MAX_BATCHES = 10000; // Safety limit to prevent infinite loops
      let lastProcessedCount = 0;
      let stuckCount = 0;

      // Process in batches
      let hasMore = true;
      while (hasMore) {
        batchNumber++;
        
        // Safety check: prevent infinite loops
        if (batchNumber > MAX_BATCHES) {
          this.logger.error(`❌ Reached maximum batch limit (${MAX_BATCHES}). Stopping to prevent infinite loop.`);
          break;
        }

        const batchStartTime = Date.now();
        
        this.logger.log(`📦 Fetching batch #${batchNumber}...`);
        const orders = await this.ordersRepo.find({
          where: {
            createdAtLocalDate: IsNull(),
          },
          take: BATCH_SIZE,
          order: {
            createdAt: 'ASC',
          },
        });

        if (orders.length === 0) {
          hasMore = false;
          this.logger.log('✅ No more orders to process');
          break;
        }

        // Check if we're stuck (processing same orders repeatedly)
        if (processed === lastProcessedCount && orders.length > 0) {
          stuckCount++;
          this.logger.warn(`⚠️  Possible stuck loop detected (${stuckCount} times). Processed count unchanged.`);
          if (stuckCount >= 3) {
            this.logger.error(`❌ Stuck loop detected. Breaking to prevent infinite loop.`);
            this.logger.error(`   Last batch had ${orders.length} orders but processed count didn't increase.`);
            this.logger.error(`   This might indicate the save operation is not persisting correctly.`);
            break;
          }
        } else {
          stuckCount = 0; // Reset if we made progress
        }

        this.logger.log(`📦 Processing batch #${batchNumber} with ${orders.length} orders...`);

        // Calculate Persian date fields for all orders
        const ordersToSave: Order[] = [];
        for (const order of orders) {
          try {
            if (!order.createdAt) {
              this.logger.warn(`⚠️  Order ${order.id} has no createdAt, skipping...`);
              continue;
            }

            // Convert to Persian date (matching subscriber logic)
            const persianDate = new pd(new Date(order.createdAt));

            // Format date as YYYY-MM-DD
            const year = persianDate.year();
            const month = String(persianDate.month()).padStart(2, '0');
            const day = String(persianDate.date()).padStart(2, '0');
            order.createdAtLocalDate = `${year}-${month}-${day}`;

            // Format time as HH:mm:ss
            const hour = String(persianDate.hour()).padStart(2, '0');
            const minute = String(persianDate.minute()).padStart(2, '0');
            const second = String(persianDate.second()).padStart(2, '0');
            order.createdAtLocalTime = `${hour}:${minute}:${second}`;

            order.createdAtLocalDayOfWeek = persianDate.day();

            ordersToSave.push(order);
          } catch (error) {
            errors++;
            this.logger.error(`❌ Error processing order ${order.id}: ${error.message}`);
          }
        }

        // Bulk update orders using update() instead of save() to avoid subscriber interference
        if (ordersToSave.length > 0) {
          try {
            const saveStartTime = Date.now();
            
            // Use update() for each order to ensure persistence
            // This bypasses the subscriber's beforeUpdate hook for createdAt changes
            const updatePromises = ordersToSave.map((order) =>
              this.ordersRepo.update(order.id, {
                createdAtLocalDate: order.createdAtLocalDate,
                createdAtLocalTime: order.createdAtLocalTime,
                createdAtLocalDayOfWeek: order.createdAtLocalDayOfWeek,
              }),
            );
            
            await Promise.all(updatePromises);
            const saveDuration = ((Date.now() - saveStartTime) / 1000).toFixed(2);
            
            // Verify the update actually persisted
            const sampleOrderId = ordersToSave[0].id;
            const verifyOrder = await this.ordersRepo.findOne({
              where: {
                id: sampleOrderId,
              },
              select: ['id', 'createdAtLocalDate', 'createdAtLocalTime', 'createdAtLocalDayOfWeek'],
            });
            
            if (!verifyOrder || !verifyOrder.createdAtLocalDate) {
              this.logger.error(`❌ Update verification failed! Order ${sampleOrderId} still has null createdAtLocalDate after update.`);
              this.logger.error(`   This indicates the update operation may not be working correctly.`);
            }
            
            lastProcessedCount = processed;
            processed += ordersToSave.length;
            
            const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(2);
            const progress = totalCount > 0 ? ((processed / totalCount) * 100).toFixed(1) : 'N/A';
            
            this.logger.log(
              `✅ Batch #${batchNumber} completed: ${ordersToSave.length} orders updated in ${saveDuration}s (batch total: ${batchDuration}s, progress: ${processed}/${totalCount} - ${progress}%)`,
            );
          } catch (error) {
            errors += ordersToSave.length;
            this.logger.error(`❌ Error bulk updating batch #${batchNumber}: ${error.message}`, error.stack);
          }
        } else {
          this.logger.warn(`⚠️  Batch #${batchNumber} had no valid orders to update`);
          // If we keep getting batches with no valid orders, we might be stuck
          if (orders.length > 0 && ordersToSave.length === 0) {
            this.logger.warn(`⚠️  All ${orders.length} orders in batch had issues. This might indicate a data problem.`);
            // Break if we consistently get no valid orders
            if (batchNumber > 5) {
              this.logger.error(`❌ Too many batches with no valid orders. Breaking loop.`);
              break;
            }
          }
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`📊 Verifying remaining orders...`);
      const remaining = await this.ordersRepo.count({
        where: {
          createdAtLocalDate: null,
        },
      });

      const result = {
        success: true,
        message: remaining === 0 ? 'All orders backfilled successfully!' : 'Batch processed',
        processed,
        errors,
        remaining,
        total: totalCount,
        duration: `${duration}s`,
        completed: remaining === 0,
      };

      if (remaining === 0) {
        this.logger.log(
          `✨ Backfill completed successfully! Processed ${processed} orders in ${duration}s (${errors} errors)`,
        );
      } else {
        this.logger.log(
          `📊 Backfill batch completed. Processed ${processed}/${totalCount} orders (${remaining} remaining, ${errors} errors) in ${duration}s`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`💥 Backfill failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Backfill failed',
        error: error.message,
      };
    }
  }
}
