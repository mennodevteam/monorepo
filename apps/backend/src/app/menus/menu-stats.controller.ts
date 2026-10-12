import { Campaign, MenuStat, MenuStatDto, Shop, StatAction } from '@menno/types';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { AuthService } from '../auth/auth.service';

@Controller('menuStats')
export class MenuStatsController {
  constructor(
    @InjectRepository(MenuStat)
    private repo: Repository<MenuStat>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Campaign)
    private campaignsRepo: Repository<Campaign>,
    private authService: AuthService,
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

  @Public()
  @Post('')
  async save(
    @Body() body: MenuStatDto,
    @Req() req: Request,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
    @Query('utmSource') utmSource?: string,
    @Query('utmMedium') utmMedium?: string,
    @Query('utmCampaign') utmCampaign?: string,
    @Query('utmTerm') utmTerm?: string,
    @Query('utmContent') utmContent?: string,
    @Query('guestId') guestId?: string,
  ) {
    const user = this.authService.getUserFromHeader(req.headers?.authorization);
    const campaignRef = await this.getActiveCampaignForMenu(body.menuId);
    await this.repo.save({
      action: body.action,
      menu: { id: body.menuId },
      product: body.productId ? { id: body.productId } : undefined,
      value: body.value,
      referrer: body.referrer || referrer,
      campaign: body.campaign || campaign,
      utmSource: body.utmSource || utmSource,
      utmMedium: body.utmMedium || utmMedium,
      utmCampaign: body.utmCampaign || utmCampaign,
      utmTerm: body.utmTerm || utmTerm,
      utmContent: body.utmContent || utmContent,
      guestId: body.guestId || guestId,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: user ? { id: user.id } : undefined,
    });
  }

  @Public()
  @Get('loadMenu/:id')
  async loadMenu(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
    @Query('utmSource') utmSource?: string,
    @Query('utmMedium') utmMedium?: string,
    @Query('utmCampaign') utmCampaign?: string,
    @Query('utmTerm') utmTerm?: string,
    @Query('utmContent') utmContent?: string,
    @Query('guestId') guestId?: string,
  ) {
    const user = this.authService.getUserFromHeader(req.headers?.authorization);
    const campaignRef = await this.getActiveCampaignForMenu(id);
    await this.repo.save({
      action: StatAction.LoadMenu,
      menu: { id },
      referrer,
      campaign,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      guestId,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: user ? { id: user.id } : undefined,
    });
  }

  @Public()
  @Get('clickProduct/:menuId/:id')
  async clickProduct(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
    @Query('utmSource') utmSource?: string,
    @Query('utmMedium') utmMedium?: string,
    @Query('utmCampaign') utmCampaign?: string,
    @Query('utmTerm') utmTerm?: string,
    @Query('utmContent') utmContent?: string,
    @Query('guestId') guestId?: string,
  ) {
    const user = this.authService.getUserFromHeader(req.headers?.authorization);
    const campaignRef = await this.getActiveCampaignForMenu(menuId);
    await this.repo.save({
      action: StatAction.ClickProduct,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      guestId,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: user ? { id: user.id } : undefined,
    });
  }

  @Public()
  @Get('addToCart/:menuId/:id')
  async addToCart(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
    @Query('utmSource') utmSource?: string,
    @Query('utmMedium') utmMedium?: string,
    @Query('utmCampaign') utmCampaign?: string,
    @Query('utmTerm') utmTerm?: string,
    @Query('utmContent') utmContent?: string,
    @Query('guestId') guestId?: string,
  ) {
    const user = this.authService.getUserFromHeader(req.headers?.authorization);
    const campaignRef = await this.getActiveCampaignForMenu(menuId);
    await this.repo.save({
      action: StatAction.AddToCart,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      guestId,
      campaignRef: campaignRef ? { id: campaignRef.id } : undefined,
      user: user ? { id: user.id } : undefined,
    });
  }
}
