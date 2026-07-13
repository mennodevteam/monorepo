import { Campaign, MenuStat, MenuStatDto, Shop, StatAction, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('menuStats')
export class MenuStatsController {
  constructor(
    @InjectRepository(MenuStat)
    private repo: Repository<MenuStat>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Campaign)
    private campaignsRepo: Repository<Campaign>,
  ) {}

  private async getActiveCampaignForMenu(menuId: string): Promise<Campaign | undefined> {
    try {
      const shop = await this.shopsRepo.findOne({
        where: { menu: { id: menuId } },
      });
      if (!shop) return undefined;

      const now = new Date();
      const campaign = await this.campaignsRepo
        .createQueryBuilder('campaign')
        .where('campaign.shop = :shopId', { shopId: shop.id })
        .andWhere('campaign.enabled = :enabled', { enabled: true })
        .andWhere('campaign.startDate <= :now AND campaign.endDate >= :now', { now })
        .getOne();
      return campaign || undefined;
    } catch {
      return undefined;
    }
  }

  @Roles(UserRole.App)
  @Post('')
  async save(
    @Body() body: MenuStatDto,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    const campaignRef = await this.getActiveCampaignForMenu(body.menuId);
    await this.repo.save({
      action: body.action,
      menu: { id: body.menuId },
      product: body.productId ? { id: body.productId } : undefined,
      value: body.value,
      referrer,
      campaign,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('loadMenu/:id')
  async loadMenu(
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    const campaignRef = await this.getActiveCampaignForMenu(id);
    await this.repo.save({
      action: StatAction.LoadMenu,
      menu: { id },
      referrer,
      campaign,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('clickProduct/:menuId/:id')
  async clickProduct(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    const campaignRef = await this.getActiveCampaignForMenu(menuId);
    await this.repo.save({
      action: StatAction.ClickProduct,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('addToCart/:menuId/:id')
  async addToCart(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    const campaignRef = await this.getActiveCampaignForMenu(menuId);
    await this.repo.save({
      action: StatAction.AddToCart,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: { id: user.id },
    });
  }
}
