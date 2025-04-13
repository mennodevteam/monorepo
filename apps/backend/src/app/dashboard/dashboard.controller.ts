import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorators';
import { Member, MenuStat, Order, OrderItem, OrderState, StatAction, UserRole } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import * as pd from 'persian-date';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(MenuStat)
    private menuStatsRepo: Repository<MenuStat>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    private auth: AuthService,
  ) {}

  @Get('sum/count')
  @Roles(UserRole.Panel)
  async getSumAndCount(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);

    const startOfDay = new pd().startOf('day').toDate();
    const startOfMonth = new pd().startOf('month').toDate();
    const startOfYear = new pd().startOf('year').toDate();
    const startOfYesterday = new pd().subtract('days', 1).startOf('day').toDate();
    const endOfYesterday = new pd().subtract('days', 1).endOf('day').toDate();
    const startOfPrevMonth = new pd().subtract('months', 1).startOf('month').toDate();
    const endOfPrevMonth = new pd().subtract('months', 1).endOf('month').toDate();
    const defaultFilter: FindOptionsWhere<Order> = {
      shop: { id: shop.id },
      state: Not(OrderState.Canceled),
    };
    return {
      today: {
        count: await this.ordersRepo.count({
          where: {
            ...defaultFilter,
            createdAt: MoreThanOrEqual(startOfDay),
          },
        }),
        sum: await this.ordersRepo.sum('totalPrice', {
          ...defaultFilter,
          createdAt: MoreThanOrEqual(startOfDay),
        }),
      },
      yesterday: {
        count: await this.ordersRepo.count({
          where: {
            ...defaultFilter,
            createdAt: Between(startOfYesterday, endOfYesterday),
          },
        }),
        sum: await this.ordersRepo.sum('totalPrice', {
          ...defaultFilter,
          createdAt: Between(startOfYesterday, endOfYesterday),
        }),
      },
      month: {
        count: await this.ordersRepo.count({
          where: {
            ...defaultFilter,
            createdAt: MoreThanOrEqual(startOfMonth),
          },
        }),
        sum: await this.ordersRepo.sum('totalPrice', {
          ...defaultFilter,
          createdAt: MoreThanOrEqual(startOfMonth),
        }),
      },
      prevMonth: {
        count: await this.ordersRepo.count({
          where: {
            ...defaultFilter,
            createdAt: Between(startOfPrevMonth, endOfPrevMonth),
          },
        }),
        sum: await this.ordersRepo.sum('totalPrice', {
          ...defaultFilter,
          createdAt: Between(startOfPrevMonth, endOfPrevMonth),
        }),
      },
      year: {
        count: await this.ordersRepo.count({
          where: {
            ...defaultFilter,
            createdAt: MoreThanOrEqual(startOfYear),
          },
        }),
        sum: await this.ordersRepo.sum('totalPrice', {
          ...defaultFilter,
          createdAt: MoreThanOrEqual(startOfYear),
        }),
      },
    };
  }

  @Roles(UserRole.Panel)
  @Get('loadMenuRef/:from/:to')
  async loadMenuRef(@LoginUser() user: AuthPayload, @Param('from') from: string, @Param('to') to: string) {
    const shop = await this.auth.getPanelUserShop(user, ['menu', 'club']);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const menuStatByRef = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select('stat.referrer', 'referrer')
      .addSelect('CAST(COUNT(DISTINCT stat.user) AS INTEGER)', 'count')
      .where('stat.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .groupBy('stat.referrer')
      .orderBy('count', 'DESC')
      .getRawMany();

    const result = {};

    menuStatByRef.forEach(({ referrer, count }) => {
      if (count === 0) return; // Skip zero counts

      let source = 'direct';

      if (referrer) {
        try {
          const url = new URL(referrer);
          const hostParts = url.hostname.split('.');
          source = hostParts.length >= 3 ? hostParts[hostParts.length - 2] : hostParts[0];
        } catch (e) {
          // If URL parsing fails, keep source as 'direct'
        }
      }

      result[source] = (result[source] || 0) + count;
    });

    return Object.entries(result).map(([source, count]) => ({ source, count }));
  }

  @Roles(UserRole.Panel)
  @Get('topProducts/:from/:to')
  async topProducts(@LoginUser() user: AuthPayload, @Param('from') from: string, @Param('to') to: string) {
    const shop = await this.auth.getPanelUserShop(user, ['menu']);
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const topProducts = await this.orderItemsRepo
      .createQueryBuilder('item')
      .select('product.title', 'product')
      .addSelect('CAST(SUM(item.quantity) AS INTEGER)', 'count')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .where('item.productId IS NOT NULL')
      .andWhere('order.shop = :shopId', { shopId: shop.id })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('order.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .andWhere('order.mergeToId IS NULL')
      .groupBy('item.product')
      .groupBy('product.title')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    return topProducts;

    // const topProducts = await this.order
    //   .createQueryBuilder('order')
    //   .select('order.productId', 'productId')
    //   .addSelect('SUM(order.count)', 'count')
    //   .where('order.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
    //   .andWhere('order.shop = :shopId', { shopId: shop.id })
    //   .andWhere('order.deletedAt IS NULL')
    //   .andWhere('order.mergeToId IS NULL')
    //   .groupBy('order.productId')
    //   .orderBy('count', 'DESC')
    //   .getRawMany();
  }

  @Roles(UserRole.Panel)
  @Get('menuStat/:from/:to')
  async menuStat(@LoginUser() user: AuthPayload, @Param('from') from: string, @Param('to') to: string) {
    const shop = await this.auth.getPanelUserShop(user, ['menu', 'club']);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const menuStatResult = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select(`DATE_TRUNC('day', stat.createdAt)`, 'day')
      .addSelect('CAST(COUNT(DISTINCT stat.user) AS INTEGER)', 'count')
      .where('stat.createdAt BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      })
      .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .groupBy('day')
      .orderBy('day')
      .getRawMany();

    const memberResult = await this.membersRepo
      .createQueryBuilder('member')
      .select(`DATE_TRUNC('day', member.joinedAt)`, 'day')
      .addSelect('CAST(COUNT(member.id) AS INTEGER)', 'count')
      .where('member.joinedAt BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      })
      .andWhere('member.clubId = :clubId', { clubId: shop.club.id })
      .groupBy('day')
      .orderBy('day')
      .getRawMany();

    const filled = [];

    const current = new Date(from);
    const end = new Date(to);

    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10); // YYYY-MM-DD
      filled.push({
        date: dateStr,
        menuCount: menuStatResult.find((item) => item.day.toISOString().slice(0, 10) === dateStr)?.count || 0,
        memberCount: memberResult.find((item) => item.day.toISOString().slice(0, 10) === dateStr)?.count || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return filled;
  }

  @Roles(UserRole.Panel)
  @Get('daily/:from/:to')
  async dailyReport(@LoginUser() user: AuthPayload, @Param('from') from: string, @Param('to') to: string) {
    const shop = await this.auth.getPanelUserShop(user, ['menu']);

    const response: { date: string; view: number; orderCount: number; orderSum: number }[] = [];

    const dailyMenuStat = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select("to_char(Date(stat.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(stat.id)', 'count')
      .where('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .andWhere('stat.createdAt >= :from', { from: `${from} 04:00:00` })
      .andWhere('stat.createdAt <= :to', { to: `${to} 23:59:59` })
      .groupBy('DATE(stat.createdAt)')
      .getRawMany();

    const dailyOrderStat = await this.ordersRepo
      .createQueryBuilder('order')
      .select("to_char(Date(order.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.totalPrice)', 'sum')
      .where('order.deletedAt IS NULL')
      .andWhere('order.mergeToId IS NULL')
      .andWhere('order.shop = :shopId', { shopId: shop.id })
      .andWhere('order.createdAt >= :from', { from: `${from} 04:00:00` })
      .andWhere('order.createdAt <= :to', { to: `${to} 23:59:59` })
      .groupBy('DATE(order.createdAt)')
      .getRawMany();

    const date = new Date(from);
    while (date.valueOf() <= new Date(to).valueOf()) {
      const dateString = date
        .toLocaleDateString('en-CA', { year: 'numeric', day: '2-digit', month: '2-digit' })
        .replace(/\//g, '-');

      const dailyOrder = dailyOrderStat.find((x) => x.date === dateString);
      const dailyMenu = dailyMenuStat.find((x) => x.date === dateString);

      response.push({
        date: dateString,
        view: dailyMenu ? Number(dailyMenu.count) : 0,
        orderCount: dailyOrder ? Number(dailyOrder?.count) : 0,
        orderSum: dailyOrder ? Number(dailyOrder?.sum) : 0,
      });

      date.setDate(date.getDate() + 1);
    }

    return response;
  }
}
