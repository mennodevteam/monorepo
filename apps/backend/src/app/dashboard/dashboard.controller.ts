import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorators';
import { MenuStat, Order, StatAction, UserRole } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(MenuStat)
    private menuStatsRepo: Repository<MenuStat>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    private auth: AuthService,
  ) {}

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
