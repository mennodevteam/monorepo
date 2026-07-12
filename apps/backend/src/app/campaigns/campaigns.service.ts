import { Injectable, HttpException, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { Campaign, Order, Shop, OrderState, CampaignAction, MenuStat, StatAction } from '@menno/types';
import { RedisService } from '../core/redis.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private campaignsRepo: Repository<Campaign>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(MenuStat)
    private menuStatsRepo: Repository<MenuStat>,
    private redisService: RedisService,
  ) {}

  private validateCampaignDates(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getTime() >= end.getTime()) {
      throw new HttpException('تاریخ شروع باید قبل از تاریخ پایان باشد', HttpStatus.BAD_REQUEST);
    }

    // Truncate seconds and milliseconds to 0
    start.setSeconds(0);
    start.setMilliseconds(0);
    end.setSeconds(0);
    end.setMilliseconds(0);

    if (start.getUTCMinutes() % 15 !== 0) {
      throw new HttpException('زمان شروع باید روی مضارب ۱۵ دقیقه تنظیم شده باشد', HttpStatus.BAD_REQUEST);
    }

    if (end.getUTCMinutes() % 15 !== 0) {
      throw new HttpException('زمان پایان باید روی مضارب ۱۵ دقیقه تنظیم شده باشد', HttpStatus.BAD_REQUEST);
    }
  }

  private async checkOverlap(shopId: string, start: Date, end: Date, excludeId?: string) {
    const query = this.campaignsRepo
      .createQueryBuilder('campaign')
      .where('campaign.shop = :shopId', { shopId })
      .andWhere('campaign.enabled = :enabled', { enabled: true })
      .andWhere('campaign.startDate < :end AND campaign.endDate > :start', { start, end });

    if (excludeId) {
      query.andWhere('campaign.id != :excludeId', { excludeId });
    }

    const overlap = await query.getOne();
    if (overlap) {
      throw new HttpException(
        `کمپین دیگری با عنوان "${overlap.title}" در بازه زمانی درخواستی هم‌پوشانی دارد.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async create(shopId: string, dto: Partial<Campaign>) {
    this.validateCampaignDates(dto.startDate, dto.endDate);
    await this.checkOverlap(shopId, dto.startDate, dto.endDate);

    const campaign = this.campaignsRepo.create({
      ...dto,
      shop: { id: shopId } as Shop,
    });

    const saved = await this.campaignsRepo.save(campaign);
    await this.redisService.clearCustomerSsrCache(shopId);
    await this.redisService.updateMenu(shopId);
    return saved;
  }

  async findAll(shopId: string) {
    const campaigns = await this.campaignsRepo.find({
      where: { shop: { id: shopId } },
      order: { startDate: 'DESC' },
    });

    const stats = await this.ordersRepo
      .createQueryBuilder('order')
      .select('order.campaignId', 'campaignId')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('SUM(order.totalPrice)', 'totalSales')
      .addSelect('SUM(COALESCE(order.materialCost, 0))', 'totalMaterialCost')
      .where('order.shop = :shopId', { shopId })
      .andWhere('order.state != :canceled', { canceled: OrderState.Canceled })
      .andWhere('order.campaignId IS NOT NULL')
      .groupBy('order.campaignId')
      .getRawMany();

    return campaigns.map((c) => {
      const stat = stats.find((s) => s.campaignId === c.id);
      const orderCount = stat ? parseInt(stat.orderCount, 10) : 0;
      const totalSales = stat ? parseFloat(stat.totalSales) : 0;
      const totalMaterialCost = stat ? parseFloat(stat.totalMaterialCost) : 0;

      const totalManualCosts = c.manualCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;
      const netProfit = totalSales - totalMaterialCost - totalManualCosts;

      return {
        ...c,
        summary: {
          orderCount,
          totalSales,
          netProfit,
        },
      };
    });
  }

  async findOne(id: string, shopId: string) {
    const campaign = await this.campaignsRepo.findOne({
      where: { id, shop: { id: shopId } },
    });
    if (!campaign) throw new NotFoundException('کمپین یافت نشد');
    return campaign;
  }

  async update(id: string, shopId: string, dto: Partial<Campaign>) {
    const campaign = await this.findOne(id, shopId);

    const newStart = dto.startDate ? new Date(dto.startDate) : campaign.startDate;
    const newEnd = dto.endDate ? new Date(dto.endDate) : campaign.endDate;

    if (dto.startDate || dto.endDate) {
      this.validateCampaignDates(newStart, newEnd);
      await this.checkOverlap(shopId, newStart, newEnd, id);
    }

    Object.assign(campaign, dto);
    const saved = await this.campaignsRepo.save(campaign);
    
    await this.redisService.clearCustomerSsrCache(shopId);
    await this.redisService.updateMenu(shopId);
    return saved;
  }

  async remove(id: string, shopId: string) {
    const campaign = await this.findOne(id, shopId);

    // Nullify references in orders and menu stats to avoid deleting orders
    await this.ordersRepo.update(
      { campaign: { id } },
      { campaign: null }
    );

    await this.menuStatsRepo.update(
      { campaignRef: { id } },
      { campaignRef: null }
    );

    await this.campaignsRepo.softRemove(campaign);

    await this.redisService.clearCustomerSsrCache(shopId);
    await this.redisService.updateMenu(shopId);
    return { success: true };
  }

  async getActiveCampaign(shopId: string) {
    const now = new Date();
    return this.campaignsRepo
      .createQueryBuilder('campaign')
      .where('campaign.shop = :shopId', { shopId })
      .andWhere('campaign.enabled = :enabled', { enabled: true })
      .andWhere('campaign.startDate <= :now AND campaign.endDate >= :now', { now })
      .getOne();
  }

  async getActiveCampaignByUsername(username: string) {
    const now = new Date();
    return this.campaignsRepo
      .createQueryBuilder('campaign')
      .innerJoin('campaign.shop', 'shop')
      .where('shop.username = :username OR shop.domain = :username', { username })
      .andWhere('campaign.enabled = :enabled', { enabled: true })
      .andWhere('campaign.startDate <= :now AND campaign.endDate >= :now', { now })
      .getOne();
  }

  async getCampaignReport(campaignId: string, shopId: string) {
    const campaign = await this.findOne(campaignId, shopId);
    
    const orders = await this.ordersRepo.find({
      where: {
        campaign: { id: campaignId },
        shop: { id: shopId },
        state: Not(OrderState.Canceled),
      },
      relations: ['items', 'customer'],
    });

    let totalSales = 0;
    let totalMaterialCost = 0;
    let totalCampaignDiscounts = 0;
    let totalWaivedDeliveryFee = 0;
    let totalOrderExtraCosts = 0;

    for (const order of orders) {
      totalSales += order.totalPrice;
      totalMaterialCost += order.materialCost || 0;
      totalOrderExtraCosts += order.extraCosts || 0;
      if (order.details?.campaignDeliveryDiscount) {
        totalWaivedDeliveryFee += order.details.campaignDeliveryDiscount;
      }
      for (const item of order.items) {
        if (item.details?.campaignDiscount) {
          totalCampaignDiscounts += item.details.campaignDiscount;
        }
      }
    }

    const totalManualCosts = campaign.manualCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;
    const totalSalesProfit = totalSales - totalMaterialCost - totalOrderExtraCosts;
    const netProfit = totalSalesProfit - totalManualCosts;

    const visits = await this.menuStatsRepo.count({
      where: {
        campaignRef: { id: campaignId },
        action: StatAction.LoadMenu,
      },
    });

    const clicks = await this.menuStatsRepo.count({
      where: {
        campaignRef: { id: campaignId },
        action: StatAction.ClickProduct,
      },
    });

    const basketAdds = await this.menuStatsRepo.count({
      where: {
        campaignRef: { id: campaignId },
        action: StatAction.AddToCart,
      },
    });

    return {
      campaignId: campaign.id,
      title: campaign.title,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      orderCount: orders.length,
      totalSales, // Net Sales (what customers actually paid)
      totalMaterialCost, // COGS
      totalCampaignDiscounts, // Product campaign discounts
      totalWaivedDeliveryFee, // Delivery fee discounts
      totalOrderExtraCosts,
      totalSalesProfit,
      totalManualCosts,
      netProfit, 
      visits,
      clicks,
      basketAdds,
      manualCosts: campaign.manualCosts || [],
      orders: orders.map((o) => ({
        id: o.id,
        trackingCode: o.trackingCode,
        totalPrice: o.totalPrice,
        materialCost: o.materialCost,
        extraCosts: o.extraCosts,
        createdAt: o.createdAt,
        state: o.state,
        customer: o.customer ? {
          firstName: o.customer.firstName,
          lastName: o.customer.lastName,
        } : null,
      })),
    };
  }

  // Cron job running every 15 minutes to clear cache on campaign state transitions
  @Cron('0 0,15,30,45 * * * *')
  async handleCampaignTransitions() {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    const campaigns = await this.campaignsRepo.find({
      where: [
        { startDate: now },
        { endDate: now },
      ],
      relations: ['shop'],
    });

    for (const c of campaigns) {
      this.logger.log(`Campaign "${c.title}" state transition at ${now.toISOString()}. Purging cache for shop ${c.shop.id}.`);
      await this.redisService.clearCustomerSsrCache(c.shop.id);
      await this.redisService.updateMenu(c.shop.id);
    }
  }
}
