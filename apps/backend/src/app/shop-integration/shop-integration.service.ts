import { Injectable, NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, Product, Shop, FilterOrderDto, OrderReportDto, OrderState, User, OrderMessageEvent } from '@menno/types';
import { RedisService } from '../core/redis.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ShopIntegrationService {
  constructor(
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private redis: RedisService,
    private ordersService: OrdersService,
  ) {}

  async getMenu(shopId: string) {
    const menuRedisData = await this.redis.updateMenu(shopId);
    if (!menuRedisData) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const menu = JSON.parse(menuRedisData);
    return menu;
  }

  async createProduct(shopId: string, dto: Partial<Product>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    if (!dto.category?.id) {
      throw new HttpException('category.id is required', HttpStatus.BAD_REQUEST);
    }

    const newProduct = this.productRepo.create({
      ...dto,
      category: { id: dto.category.id, menu: shop.menu },
    });

    const saved = await this.productRepo.save(newProduct);
    await this.redis.updateMenu(shopId);
    return saved;
  }

  async updateProduct(shopId: string, productId: string, dto: Partial<Product>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Verify product belongs to this shop's menu
    const existing = await this.productRepo.findOne({
      where: {
        id: productId,
        category: { menu: { id: shop.menu?.id } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Product not found in this shop');
    }

    // Update fields
    const updated = await this.productRepo.save({
      ...existing,
      ...dto,
      id: productId, // ensure ID is not changed
    });

    await this.redis.updateMenu(shopId);
    return updated;
  }

  async getOrders(shopId: string, filters: FilterOrderDto) {
    filters.shopId = shopId;
    // Call the existing orders service filter method
    return this.ordersService.filter(filters, [
      'items.product',
      'items.productVariant',
      'customer',
      'waiter',
      'creator',
    ]);
  }

  async updateOrderState(shopId: string, orderId: string, state: number, waiterId?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, shop: { id: shopId } },
      relations: ['waiter'],
    });

    if (!order) {
      throw new NotFoundException('Order not found in this shop');
    }

    order.state = state as OrderState;
    if (waiterId && !order.waiter) {
      order.waiter = { id: waiterId } as User;
    }

    await this.orderRepo.save(order);
    
    // Trigger existing side effects (like SMS sending)
    this.ordersService.checkAfterUpdateOrderMessage(orderId, OrderMessageEvent.OnChangeState);
    
    return order;
  }

  async getSalesReport(shopId: string, query: { fromDate?: string; toDate?: string; groupBy?: string }) {
    const dto: OrderReportDto = {
      shopId,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      groupBy: (query.groupBy || 'date') as any,
    };
    return this.ordersService.report(dto);
  }
}
